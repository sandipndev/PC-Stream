/* Imports for all apis */
const { req_data_check, send_error } = require("../misc/randomfuncs")
const path = require("path")
const sqlite3 = require("sqlite3")

/* To get video duration data and some streamable random functions */
const { getVideoDurationInSeconds } = require("get-video-duration")
const { pathExists, 
        isPathAbs, 
        getFileSize, 
        modifiedTime, 
        video_extentions_streamable, 
        audio_extentions_streamable } = require("../misc/randomfuncs")

module.exports = function ( req, res, emitter ) {

    /* File was sent */
    if ( req_data_check(req.body["file"]) ) {

        /*  Path must be absolute*/
        if ( !isPathAbs(req.body["file"]) ) {
            res.status(400).send("PATH_NOT_ABS")
            return
        }

        /* Database Object */
        let db = new sqlite3.Database(path.join(__dirname, "..", "records.db"))

        /* Get the not permitted folders */
        db.all(`SELECT folders_unallowed FROM permissions WHERE user_id = ?`, req.user_id, 
        (e, r)=> {

            /* Database Error */
            if (e) {
                send_error(res, "DBERR", e)
                return
            }

            /* Folders that are not allowed */
            let unallowed_dirs = JSON.parse(r[0].folders_unallowed)

            /* Windows, process dirs in "\\" way instead of "/" */
            if (process.platform == "win32") {
                for (var i=0; i<unallowed_dirs.length; i++) {
                    unallowed_dirs[i] = unallowed_dirs[i].replace(/\//g, "\\")
                }
            }

            /* Given file is inside an unallowed dir */
            for (var i=0; i<unallowed_dirs.length; i++) {
                if (req.body["file"].includes(unallowed_dirs[i])) {
                    res.status(400).send("FILE_DNE")
                    return
                }
            }

            /* File has really no existence */
            if ( !pathExists(req.body["file"]) ) {
                res.status(400).send("FILE_DNE")
                return
            }

            /* File exists and user got perms, send data */
            try {

                /* Readying the transmission data with file size and last modified */
                let tx = {
                    file_size: getFileSize(req.body["file"]),
                    last_modified: modifiedTime(req.body["file"]),
                    is_streamable: false
                }

                /* Extension, this will be required */
                let ext = path.extname(req.body["file"]).toLowerCase()

                /* This is a video file */
                if (video_extentions_streamable.includes(ext)) {
                    tx.is_streamable = true
                    tx.type = "video"

                    /* Generate the duration of this streamable video */
                    getVideoDurationInSeconds(req.body["file"]).then((duration)=>{
                        tx.duration = duration
                        res.status(200).send(tx)
                    })
                }

                /* This is an audio file */
                else if (audio_extentions_streamable.includes(ext)) {
                    tx.is_streamable = true
                    tx.type = "audio"

                    /* Generate the duration of this streamable audio */
                    getVideoDurationInSeconds(req.body["file"]).then((duration)=>{
                        tx.duration = duration
                        res.status(200).send(tx)
                    })
                }

                /* This is a simple non-streamable file */
                else 
                    res.status(200).send(tx)

                /* Emit event */
                emitter.emit("api:getfileinfo:ReqInfo", {
                    user_id: req.user_id,
                    file: req.body["file"]
                })

            } 
            
            /* Error? File has no existence */
            catch(error) {
                res.status(400).send("FILE_DNE")
            }

            /* Closing database after database ops */
            db.close()
        })
    } else {
        /* File was not sent */
        res.status(400).send("DATA_X")
    }
}
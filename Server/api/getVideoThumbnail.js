/* Imports for all apis */
const { req_data_check, send_error } = require("../misc/randomfuncs")
const path = require("path")
const sqlite3 = require("sqlite3")

/* Imports to get video thumbnail */
const { getVideoDurationInSeconds } = require("get-video-duration")
const { get_thumbnail, 
        isPathAbs, 
        pathExists, 
        deleteFile, 
        video_extentions_streamable } = require("../misc/randomfuncs")

module.exports = function (req, res, emitter) {

    /* A file needs to be sent.
       An "at" duration may be sent. If it's sent, it must be between 0-100 */
    if ( req_data_check(req.body["file"]) && ( req_data_check(req.body["at"]) ? typeof req.body["at"] === "number" &&
    (0 <= req.body["at"] && req.body["at"] <= 100) : true ) ) {

        /* Path must be absolute */
        if (!isPathAbs(req.body["file"])) {
            res.status(400).send("PATH_NOT_ABS")
            return
        }

        /* It is not a file */
        if (!path.extname(req.body["file"])) {
            res.status(400).send("FILE_X")
        }

        /* Database Object */
        let db = new sqlite3.Database(path.join(__dirname, "..", "records.db"))

        /* Get the not permitted folders */
        db.all(`SELECT folders_unallowed, can_download FROM permissions WHERE user_id = ?`, req.user_id, 
        (e, r)=> {

            /* Database Error */
            if (e) {
                send_error(res, "DBERR", e)
                return
            }

            /* Permission checking - Stream perms required */
            if (r[0].can_download == 0) {
                res.status(400).send("DL_X")
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

            /*  Given file is inside an unallowed dir*/
            for (var i=0; i<unallowed_dirs.length; i++) {
                if (req.body["file"].includes(unallowed_dirs[i])) {
                    res.status(400).send("FILE_DNE")
                    return
                }
            }

            /* File has really no existence */
            if (!pathExists(req.body["file"])) {
                res.status(400).send("FILE_DNE")
                return
            }

            /* Check for video extension */
            var ext = path.extname(req.body["file"])
            if (!video_extentions_streamable.includes(ext)) {
                res.status(400).send("NOT_VID")
                return
            }

            /* Calculate at time - if not mentioned, send at 50% */
            const send_at = `${(req.body["at"] === 0 || req.body["at"])? req.body["at"] : 50}%`
            
            /* Get the thumbnail and send the base64 */
            get_thumbnail(req.body["file"], send_at)
            .then((thumb) => {

                /* Send thumbnail */
                res.status(200).send({
                    thumbnail: thumb.base64
                })

                /* Delete the thumbnail after done */
                deleteFile(thumb.thumbpath, () => {})

                /* Emit event */
                emitter.emit("api:getvideothumbnail:SendThumbnail", {
                    user_id: req.user_id,
                    file: req.body["file"]
                })

            })
        })

    } else {
        /* Data not sent */
        res.status(400).send("DATA_X")
    }

}
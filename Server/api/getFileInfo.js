const { getVideoDurationInSeconds } = require('get-video-duration')
const { pathExists, isPathAbs, getFileSize, video_extentions_streamable, audio_extentions_streamable } = require("../misc/randomfuncs")
const path = require('path')
const sqlite3 = require('sqlite3').verbose()

module.exports = function ( req, res, emitter ) {
    if (req.body["file"] && typeof req.body["file"] === "string") {

        // Username and Password are sent and of type Strings

        // Database checks
        var db = new sqlite3.Database('records.db')
        db.all(`SELECT folders_unallowed
        FROM permissions
        WHERE user_id = ?`, req.user_id, (_, r1)=> {

            let unallowed_dirs = JSON.parse(r1[0].folders_unallowed)

            // correcting dir format for windows
            if (process.platform == 'win32') {
                for (var i=0; i<unallowed_dirs.length; i++) {
                    unallowed_dirs[i] = unallowed_dirs[i].replace(/\//g, "\\")
                }
            }

            // Path must be absolute
            if (!isPathAbs(req.body["file"])) {
                res.status(400).send("PATH_NOT_ABS")
                return
            }

            // Given file is inside an unallowed dir
            for (var i=0; i<unallowed_dirs.length; i++) {
                if (req.body["file"].includes(unallowed_dirs[i])) {
                    res.status(400).send("FILE_DNE")
                    return
                }
            }

            // File has no existence really
            if (!pathExists(req.body["file"])) {
                res.status(400).send("FILE_DNE")
                return
            }

            // Okay, now send details
            // To send - Filesize, ...
            try {
                var x = getFileSize(req.body["file"])

                var tx = {
                    file_size: x,
                    is_streamable: false
                }
                
                // If control is here, that means file exists
                var ext = path.extname(req.body["file"]).toLowerCase()

                if (video_extentions_streamable.includes(ext)) {
                    tx.is_streamable = true
                    tx.type = 'video'
                    getVideoDurationInSeconds(req.body["file"]).then((duration)=>{
                        tx.duration = duration
                        res.status(200).send(tx)
                    })
                } else if (audio_extentions_streamable.includes(ext)) {
                    tx.is_streamable = true
                    tx.type = 'audio'
                    getVideoDurationInSeconds(req.body["file"]).then((duration)=>{
                        tx.duration = duration
                        res.status(200).send(tx)
                    })
                } else {
                    res.status(200).send(tx)
                }


            } catch(error) {
                res.status(400).send("FILE_DNE")
            }

            

        })
    } else {
        // Data not sent
        res.status(400).send("DATA_X")
    }
}
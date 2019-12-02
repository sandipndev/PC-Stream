const { resDataCheck, get_thumbnail, isPathAbs, pathExists, deleteFile, video_extentions_streamable } = require("../misc/randomfuncs")
const { getVideoDurationInSeconds } = require('get-video-duration')
const sqlite3 = require('sqlite3')
const path = require('path')

module.exports = function (req, res, emitter) {

    if (resDataCheck(req.body["file"]) && resDataCheck(req.body["at"]) && typeof req.body["at"] === "number") {

        // Database checks
        var db = new sqlite3.Database(path.join(__dirname, '..', 'records.db'))
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

            var ext = path.extname(req.body["file"])
            if (!video_extentions_streamable.includes(ext)) {
                res.status(400).send("NOT_VID")
                return
            }

            getVideoDurationInSeconds(req.body["file"]).then((duration) => {
                if (!(0 <= req.body["at"] <= duration)) {
                    res.status(400).send("DURATION_X")
                    return
                }

                get_thumbnail(req.body["file"], req.body["at"])
                    .then((thumb) => {
                        res.status(200).send({
                            thumbnail: thumb.base64
                        })

                        deleteFile(thumb.thumbpath, () => {})

                    })

            })

        })

    } else {
        // Data not sent
        res.status(400).send("DATA_X")
    }

}
const { pathExists, isDir, isPathAbs, deleteFile } = require("../misc/randomfuncs")
const path = require('path')
const sqlite3 = require('sqlite3')

module.exports = function ( req, res, emitter ) {
    if (req.body["file"] && typeof req.body["file"] === "string" && req.body["file"] !== "") {

        // Database checks
        var db = new sqlite3.Database(path.join(__dirname, '..', 'records.db'))
        db.all(`SELECT folders_unallowed, can_delete
        FROM permissions
        WHERE user_id = ?`, req.user_id, (_, r1)=> {

            // Session Key exists and correct
            let unallowed_dirs = JSON.parse(r1[0].folders_unallowed)

            // correcting dir format for windows
            if (process.platform == 'win32') {
                for (var i=0; i<unallowed_dirs.length; i++) {
                    unallowed_dirs[i] = unallowed_dirs[i].replace(/\//g, "\\")
                }
            }

            // No perms
            if (r1[0].can_delete === 0) {
                res.status(400).send("CANT_DX")
                return
            }

            // Path must be absolute
            if (!isPathAbs(req.body["file"])) {
                res.status(400).send("PATH_NOT_ABS")
                return
            }

            if (isDir(req.body["file"])) {
                res.status(400).send("DIR_CANT")
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

            // Okay, now delete
            deleteFile(req.body["file"], (err)=>{
                if (err) {
                    res.sendStatus(500)
                } else {
                    res.sendStatus(200)
                }
            })

        })
    } else {
        // Data not sent
        res.status(400).send("DATA_X")
    }
}
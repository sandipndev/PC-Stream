const { resDataCheck, pathExists, isPathAbs, renameFile } = require("../misc/randomfuncs")
const path = require('path')
const sqlite3 = require('sqlite3')

module.exports = function ( req, res, emitter ) {
    if (resDataCheck(req.body["from_name"]) && resDataCheck(req.body["to_name"])) {

        // Database checks
        var db = new sqlite3.Database(path.join(__dirname, '..', 'records.db'))
        db.all(`SELECT folders_unallowed, can_rename
        FROM permissions
        WHERE user_id = ?`, req.user_id, (_, r1)=> {

            // Session Key exists and correct
            let unallowed_dirs = JSON.parse(r1[0].folders_unallowed)

            // correcting dir format for windows
            if (process.platform == 'win32') {
                req.body["from_name"] = req.body["from_name"].replace(/\//g, "\\")
                req.body["to_name"] = req.body["to_name"].replace(/\//g, "\\")
                for (var i=0; i<unallowed_dirs.length; i++) {
                    unallowed_dirs[i] = unallowed_dirs[i].replace(/\//g, "\\")
                }
            }

            // No perms
            if (r1[0].can_rename === 0) {
                res.status(400).send("CANT_RN")
                return
            }

            // Path must be absolute
            if (!isPathAbs(req.body["from_name"]) || !isPathAbs(req.body["to_name"])) {
                res.status(400).send("PATH_NOT_ABS")
                return
            }

            // Given file is inside an unallowed dir
            for (var i=0; i<unallowed_dirs.length; i++) {
                if (req.body["from_name"].includes(unallowed_dirs[i])) {
                    res.status(400).send("FILE_DNE")
                    return
                }
            }

            // Source File/Dir has no existence really
            if (!pathExists(req.body["from_name"])) {
                res.status(400).send("FILE_DNE")
                return
            }

            // Okay, now rename
            renameFile(req.body["from_name"], req.body["to_name"], (err)=>{
                if (err) {
                    res.status(500).send(err)
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
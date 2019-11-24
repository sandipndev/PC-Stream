const { pathExists, isFile, isPathAbs } = require("../misc/randomfuncs")
const { randomBytes } = require('crypto')
const path = require('path')

const sqlite3 = require('sqlite3')

module.exports = function ( req, res, emitter ) {
    if (req.body["file"] && typeof req.body["file"] === "string" && req.body["file"] !== "") {

        // Database checks
        var db = new sqlite3.Database(path.join(__dirname, '..', 'records.db'))
        db.all(`SELECT folders_unallowed, can_download
        FROM permissions
        WHERE user_id = ?`, req.user_id, (_, r1)=> {

            // Permission checking - Download perms required to stream
            if (r1[0].can_download == 0) {
                res.status(400).send("CANT_DL_STREAM")
                return
            }

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

            // Given is not a file
            if (!isFile(req.body["file"])) {
                res.status(400).send("FILE_DNE")
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
            
            // Generate Key
            let key = randomBytes(20).toString('hex')

            db.all(`INSERT INTO stream_keys(key, by_user, file) VALUES (?, ?, ?)`,[
                key,
                req.user_id,
                req.body["file"]
            ], (err) => {
                if (!err)
                    res.status(200).send({
                        "token": key
                    })
                else
                    res.status(500).send("SERVER_ERR")
            })

        })

    } else {
        // Data not sent
        res.status(400).send("DATA_X")
    }
}
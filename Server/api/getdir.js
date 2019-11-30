const fs = require('fs')
const path = require('path')
const { resDataCheck, driveDataWin, isPathAbs, isDir, isFile } = require("../misc/randomfuncs")

const sqlite3 = require('sqlite3')

module.exports = function ( req, res, emitter ) {

    if(resDataCheck(req.body["dir"])) {
        
        // Username and Password are sent and of type Strings

        // Database checks
        var db = new sqlite3.Database(path.join(__dirname, '..', 'records.db'))
        db.all(`SELECT folders_unallowed
        FROM permissions
        WHERE user_id = ?`, req.user_id, (_, r1)=> {

            let unallowed_dirs = JSON.parse(r1[0].folders_unallowed)

            if (process.platform == 'win32') {
                for (var i=0; i<unallowed_dirs.length; i++) {
                    unallowed_dirs[i] = unallowed_dirs[i].replace(/\//g, "\\")
                }
            }

            if (req.body["dir"] == "/" && process.platform == "win32") {
                driveDataWin().then((rx) => {
                    res.status(200).send({disks: rx})
                })
                return
            }

            // only in win, there's a concept of drives so otherwise no drives will be asked

            // Path must be absolute
            if (!isPathAbs(req.body["dir"])) {
                res.status(400).send("PATH_NOT_ABS")
                return
            }

            // Given directory must not contain in unallowed
            if (unallowed_dirs.includes(req.body["dir"])) {
                res.status(400).send("DIR_DNE")
                return
            }

            // Given directory is inside an unallowed dir
            for (var i=0; i<unallowed_dirs.length; i++) {
                if (req.body["dir"].includes(unallowed_dirs[i])) {
                    res.status(400).send("DIR_DNE")
                    return
                }
            }

            var response = {}
            response["files"] = []
            response["folders"] = []
            response["others"] = []

            fs.readdir(req.body["dir"], (err, files) => {
                if (err) {
                    res.status(500).send("SERVER_ERR")
                } else {

                    for (var i=0; i<files.length; i++) {

                        var element = files[i]

                        // Full path
                        var p = path.join(req.body["dir"], element)

                        try {
                            // Seperating dirs and folders
                            if (isDir(p)) {
                                if (unallowed_dirs.includes(p))
                                    continue
                                else
                                    response["folders"].push(element)
                            } else if (isFile(p)) {
                                response["files"].push(element)
                            }
                        } catch {
                            // Weird files causing errors
                            response["others"].push(element)
                        }
                        
                    }

                    res.status(200).send(response)

                }
            })

        })

        // Closing database after database ops
        db.close()
    } else {
        // Data not sent
        res.status(400).send("DATA_X")
    }
}
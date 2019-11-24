const { streamable, getDirectories, isChild, isFile, isPathAbs , isDir} = require("../misc/randomfuncs")
const path = require('path')
const sqlite3 = require('sqlite3').verbose()

module.exports = function ( req, res, emitter ) {

    if(req.body["dir"] && typeof req.body["dir"] === "string" && req.body["dir"] !== "") {

        if (req.body["dir"] === "/") {
            res.status(400).send("ROOT_X")
        }

        // Database checks
        var db = new sqlite3.Database('records.db')
        db.all(`SELECT folders_unallowed
        FROM permissions
        WHERE user_id = ?`, req.user_id, (_, r1)=> {
 
            let unallowed_dirs = JSON.parse(r1[0].folders_unallowed)

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

            try {
                if (!isDir(req.body["dir"])) {
                    res.status(400).send("DIR_X")
                    return
                }
            } catch {
                res.status(400).send("DIR_DNE")
                return
            }

            getDirectories(req.body["dir"], (err, rex) => {

                if (err) {
                    res.sendStatus(500)
                    return
                }

                var media = []
                
                for (var i=0; i<rex.length; i++) {

                    const file = rex[i]

                    if (file === "System Volume Information") {
                        continue
                    }

                    if (isFile(file) && streamable.indexOf(path.extname(file)) > -1) {

                        let flag = true

                        for (var j=0; j<unallowed_dirs.length; j++) {
                            if (isChild(unallowed_dirs[j], file)) {
                                flag = false
                                break
                            }
                        }

                        if (flag) {
                            media.push(file)
                        }

                    }

                }

                res.status(200).send({ media })

            })

        })

    }
}
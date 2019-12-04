/* Imports for all apis */
const { req_data_check, send_error } = require("../misc/randomfuncs")
const path = require("path")
const sqlite3 = require("sqlite3")

const { streamable, 
        getDirectories, 
        isChild,
        isPathAbs } = require("../misc/randomfuncs")

module.exports = function ( req, res, emitter ) {

    /* Dir is sent */
    if( req_data_check(req.body["dir"]) ) {

        /* The root/all drives won't be scanned */
        if (req.body["dir"] === "/") {
            res.status(400).send("ROOT_X")
        }

        /* Path given must be absolute */
        if ( !isPathAbs(req.body["dir"]) ) {
            res.status(400).send("PATH_NOT_ABS")
            return
        }

        /* It is not a dir */
        if (!!path.extname(req.body["dir"])) {
            res.status(400).send("DIR_X")
            return
        }

        /* Database Object */
        let db = new sqlite3.Database(path.join(__dirname, "..", "records.db"))

        /* Get the not permitted folders */
        db.all(`SELECT folders_unallowed FROM permissions WHERE user_id = ?`, req.user_id, 
        (e, r) => {

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

            /* Given directory must not be an unallowed */
            if (unallowed_dirs.includes(req.body["dir"])) {
                res.status(400).send("DIR_DNE")
                return
            }

            /* Neither must the directory be inside unallowed */
            for (var i=0; i<unallowed_dirs.length; i++) {
                if (req.body["dir"].includes(unallowed_dirs[i])) {
                    res.status(400).send("DIR_DNE")
                    return
                }
            }

            /* The dir must actually exist */
            if (!!pathExists(req.body["dir"])) {
                res.status(400).send("DIR_DNE")
                return
            }

            /* Go through the directories */
            getDirectories(req.body["dir"], (e, r) => {

                /* Some error occured when moving through the dirs */
                if (e) {
                    send_error(res, "DIRSCANERR", e)
                    return
                }

                /* Media list */
                let media = []
                
                /* Scan through every file */
                for (var i=0; i<r.length; i++) {

                    /* Save the file seperately */
                    const file = r[i]

                    /* This is a weird file, causing errors */
                    if (file === "System Volume Information") {
                        continue
                    }

                    /* Some files are just weird and cause errors. To get rid of them. */
                    try {

                        /* If is streamable, add to media */
                        if (!!path.extname(file) && streamable.indexOf(path.extname(file)) > -1) {

                            /* Flag to know if it is allowed for user */
                            let flag = true

                            /* Check in all unallowed dirs, this is the reason this api might be a little slow */
                            for (var j=0; j<unallowed_dirs.length; j++) {
                                if (isChild(unallowed_dirs[j], file)) {
                                    flag = false
                                    break
                                }
                            }

                            /* If allowed, push */
                            if (flag) 
                                media.push(file)

                        }
                    }
                    
                    catch {
                        /* I hate you, baddy baddy file */
                        continue
                    }
                }

                /* Send this media */
                res.status(200).send({ media })

                /* Emit event */
                emitter.emit("api:recursivemediasearch:Searched", {
                    user_id: req.user_id,
                    dir: req.body["dir"]
                })

            })
        })
    }

    else {
        res.status(400).send("DATA_X")
    }
}
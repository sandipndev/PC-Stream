/* Imports for all apis */
const { req_data_check, send_error } = require("../misc/randomfuncs")
const path = require("path")
const sqlite3 = require("sqlite3")

/* To read a directory and generate drive data */
const { driveDataWin, isPathAbs, isDir, isFile } = require("../misc/randomfuncs")
const { readdir } = require("fs")

module.exports = function ( req, res, emitter ) {

    /* Username and Password are sent and of type Strings */
    if( req_data_check(req.body["dir"]) ) {

        /* Path given must be absolute */
        if ( !isPathAbs(req.body["dir"]) ) {
            res.status(400).send("PATH_NOT_ABS")
            return
        }

        /* Requesting for root directory sends drive data in Windows */
        if (req.body["dir"] == "/" && process.platform == "win32") {
            driveDataWin().then((rx) => {
                res.status(200).send({disks: rx})
            })
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

            /* Create the basic response */
            var response = {}
            response["files"] = []
            response["folders"] = []
            response["others"] = []

            /* Read the directory now */
            readdir(req.body["dir"], (e, files) => {

                /* There was some error while reading the directory */
                if (e) {
                    send_error(res, "FSERR", e)
                    return
                }
                
                else {
                    /* Loop over the files */
                    for (var i=0; i<files.length; i++) {

                        /* This element */
                        var element = files[i]

                        /* Full path of current element */
                        var p = path.join(req.body["dir"], element)

                        try {
                            /* Seperating dirs and folders */
                            if (isDir(p)) {

                                /* Current user doesn"t have the perms to see this dir */
                                if (unallowed_dirs.includes(p))
                                    continue
                                
                                /* Add to folder */
                                else
                                    response["folders"].push(element)
                            } 
                            
                            else if (isFile(p)) {
                                /* Add to file */
                                response["files"].push(element)
                            }

                            else {
                                /* Add to others */
                                response["others"].push(element)
                            }
                        } catch {
                            /* Add to weird files causing errors */
                            response["others"].push(element)
                        }
                    }

                    /* Send this data */
                    res.status(200).send(response)

                    /* Raise event */
                    emitter.send("api:getdir:ReqDir", {
                        user_id: req.user_id,
                        dir: req.body["dir"]
                    })
                }
            })

            /* Closing database after database ops */
            db.close()
        })

    } else {
        /* Dir was not sent */
        res.status(400).send("DATA_X")
    }
}
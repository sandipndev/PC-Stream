/* Imports for all apis */
const { req_data_check, send_error } = require("../misc/randomfuncs")
const path = require("path")
const sqlite3 = require("sqlite3")

/* Functions needed for rename file */
const { pathExists, 
        isPathAbs, 
        renameFile } = require("../misc/randomfuncs")

module.exports = function ( req, res, emitter ) {

    /* We need "from_name" and "to_name" */
    if ( req_data_check(req.body["from_name"]) && req_data_check(req.body["to_name"]) ) {

        /*  Path must be absolute*/
        if (!isPathAbs(req.body["from_name"]) || !isPathAbs(req.body["to_name"])) {
            res.status(400).send("PATH_NOT_ABS")
            return
        }

        /* Database Object */
        let db = new sqlite3.Database(path.join(__dirname, "..", "records.db"))

        /* Get the not permitted folders and rename permission check */
        db.all(`SELECT folders_unallowed, can_rename FROM permissions WHERE user_id = ?`, req.user_id, 
        (e, r)=> {

            /* Database Error */
            if (e) {
                send_error(res, "DBERR", e)
                return
            }

            /* No perms to rename */
            if (r[0].can_rename === 0) {
                res.status(400).send("CANT_RN")
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

            /* Given file is inside an unallowed dir */
            for (var i=0; i<unallowed_dirs.length; i++) {
                if (req.body["file"].includes(unallowed_dirs[i])) {
                    res.status(400).send("DNE")
                    return
                }
            }

            /* Source File/Dir has no existence really */
            if (!pathExists(req.body["from_name"])) {
                res.status(400).send("DNE")
                return
            }

            /* Okay, now rename */
            renameFile(req.body["from_name"], req.body["to_name"], (e) => {

                /* Error occured when renaming */
                if (e) {
                    send_error(res, "FSERR", e)
                    return
                }

                /* Send a OK status and emit event */
                else {
                    res.sendStatus(200)

                    emitter.emit("api:rename:RenameFile", {
                        user_id: req.user_id,
                        from: req.body["from_name"],
                        to: req.body["to_name"]
                    })
                }
            })
        })
    } 
    
    /* From and To name not given */
    else
        res.status(400).send("DATA_X")

}
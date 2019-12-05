/* Imports for all apis */
const { req_data_check, send_error } = require("../misc/randomfuncs")
const path = require("path")
const sqlite3 = require("sqlite3")

const { pathExists,
        isPathAbs, 
        deleteFile } = require("../misc/randomfuncs")

module.exports = function ( req, res, emitter ) {

    /* A file needs to be sent to be deleted */
    if ( req_data_check(req.body["file"]) ) {

        /*  Path must be absolute*/
        if ( !isPathAbs(req.body["file"]) ) {
            res.status(400).send("PATH_NOT_ABS")
            return
        }

        /* It is not a file */
        if (!path.extname(req.body["file"])) {
            res.status(400).send("FILE_X")
            return
        }

        /* Database Object */
        let db = new sqlite3.Database(path.join(__dirname, "..", "records.db"))

        /* Get the not permitted folders */
        db.all(`SELECT folders_unallowed, can_delete FROM permissions WHERE user_id = ?`, req.user_id, 
        (e, r)=> {

            /* Database Error */
            if (e) {
                send_error(res, "DBERR", e)
                return
            }

            /* No perms */
            if (r[0].can_delete === 0) {
                res.status(400).send("CANT_DX")
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
                    res.status(400).send("FILE_DNE")
                    return
                }
            }

            /* File has really no existence */
            if ( !pathExists(req.body["file"]) ) {
                res.status(400).send("FILE_DNE")
                return
            }

            /* Okay, now delete */
            deleteFile(req.body["file"], (e)=>{

                /* Error */
                if (e) {
                    /* This is error */
                    send_error(res, "FSERR", e)
                } else {
                    /* Perfect, send ok */
                    res.sendStatus(200)
                }
            })

        })
    } 

    else {
        /* File not sent */
        res.status(400).send("DATA_X")
    }
}
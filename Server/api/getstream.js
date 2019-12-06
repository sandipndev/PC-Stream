/* Imports for all apis */
const { req_data_check, send_error } = require("../misc/randomfuncs")
const path = require("path")
const sqlite3 = require("sqlite3")

/* Create random token for stream */
const { pathExists, isPathAbs, streamable } = require("../misc/randomfuncs")
const { randomBytes } = require("crypto")

module.exports = function ( req, res, emitter ) {

    /* A file needs to be sent to stream */
    if ( req_data_check(req.body["file"]) ) {

        /* Path must be absolute */
        if (!isPathAbs(req.body["file"])) {
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
        db.all(`SELECT folders_unallowed, can_download FROM permissions WHERE user_id = ?`, req.user_id, 
        (e, r)=> {

            /* Database Error */
            if (e) {
                send_error(res, "DBERR", e)
                return
            }

            /* Permission checking - Stream perms required */
            if (r[0].can_download == 0) {
                res.status(400).send("DL_X")
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

            /*  Given file is inside an unallowed dir*/
            for (var i=0; i<unallowed_dirs.length; i++) {
                if (req.body["file"].includes(unallowed_dirs[i])) {
                    res.status(400).send("FILE_DNE")
                    return
                }
            }

            /* File has really no existence */
            if (!pathExists(req.body["file"])) {
                res.status(400).send("FILE_DNE")
                return
            }

            /* Get last watched till, in case the user watched it previously */
            db.all(`SELECT percent_watched FROM watch_hist WHERE user_id = ? AND absolute_path = ?`, [ req.user_id, req.body["file"] ], 
            (e, watched_till) => {

                /* Database Error */
                if (e) {
                    send_error(res, "DBERR", e)
                    return
                }

                /* Generate Key */
                let key = randomBytes(20).toString("hex")

                /* Insert key in database */
                db.all(`INSERT INTO stream_keys(key, by_user, file) VALUES (?, ?, ?)`,[ key, req.user_id, req.body["file"] ], 
                (e) => {
                    /* Database Error */
                    if (e) {
                        send_error(res, "DBERR", e)
                        return
                    }

                    /* Send response with stream token */
                    res.status(200).send({
                        "watched_till": (watched_till.length == 0) ? 0 : watched_till[0].percent_watched,
                        "streamable_content": streamable.includes(path.extname(req.body["file"])) ? true : false,
                        "token": key
                    })

                    /* Emit event */
                    emitter.emit("api:getstream:AskedStream", {
                        user_id: req.user_id,
                        file: req.body["file"]
                    })

                    /* Closing database after database ops */
                    db.close()
                })
            })
        })
    }
    
    /* File was not sent */
    else
        res.status(400).send("DATA_X")

}
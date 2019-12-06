/* Imports for all apis */
const { req_data_check, send_error } = require("../misc/randomfuncs")
const path = require("path")
const sqlite3 = require("sqlite3")

/* For uploads we need these */
const { isPathAbs, pathExists, deleteFile } = require("../misc/randomfuncs")

function delTempFile(f) {
    deleteFile(f, () => {})
}

module.exports = function (req, res, emitter) {

    /* A file and a move to point to be sent */
    if ( req_data_check(req.body["moveTo"]) && !!req.files["file"] ) {

        /* This is the file */
        const file = req.files["file"]

        /* Path given must be absolute */
        if ( !isPathAbs(req.body["moveTo"]) ) {
            res.status(400).send("PATH_NOT_ABS")
            delTempFile(file["tempFilePath"])
            return
        }

        /* Database Object */
        let db = new sqlite3.Database(path.join(__dirname, "..", "records.db"))

        /* Get the not permitted folders */
        db.all(`SELECT folders_unallowed, can_upload FROM permissions WHERE user_id = ?`, req.user_id, 
        (e, r) => {

            /* Database Error */
            if (e) {
                send_error(res, "DBERR", e)
                delTempFile(file["tempFilePath"])
                return
            }

            /* No perms */
            if (r[0].can_upload === 0) {
                res.status(400).send("CANT_UP")
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
            if (unallowed_dirs.includes(req.body["moveTo"])) {
                res.status(400).send("DIR_DNE")
                delTempFile(file["tempFilePath"])
                return
            }

            /* Neither must the directory be inside unallowed */
            for (var i=0; i<unallowed_dirs.length; i++) {
                if (req.body["moveTo"].includes(unallowed_dirs[i])) {
                    res.status(400).send("DIR_DNE")
                    delTempFile(file["tempFilePath"])
                    return
                }
            }

            /* The dir must actually exist */
            if (!pathExists(req.body["moveTo"])) {
                res.status(400).send("DIR_DNE")
                delTempFile(file["tempFilePath"])
                return
            }

            /* Total file path and file */
            const moveTo = path.join(req.body["moveTo"], file["name"])

            /* This new file must not be present there */
            if (pathExists(moveTo)) {
                res.status(400).send("ALREADY_EXISTS")
                delTempFile(file["tempFilePath"])
                return
            }

            /* Okays, now upload */
            file.mv(moveTo, (e) => {

                /* If error, send it */
                if (e) {
                    send_error(res, "FSERR", e)
                    delTempFile(file["tempFilePath"])
                    return
                }

                /* Send status OK */
                res.sendStatus(200)

                /* Emit event */
                emitter.emit("api:upload:UploadDone", {
                    user_id: req.user_id,
                    file: file["name"],
                    moveTo
                })

            })

            /* Close database */
            db.close()
            
        })
    }

    /* The file or the location not sent */
    else
        res.status(400).send("DATA_X")

}
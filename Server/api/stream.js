/* Imports for all apis */
const { req_data_check, send_error } = require("../misc/randomfuncs")
const path = require("path")
const sqlite3 = require("sqlite3")

module.exports = function ( req, res, emitter ) {

    /* A token is required */
    if ( req_data_check(req.query["token"]) ) {

        /* Database Object */
        let db = new sqlite3.Database(path.join(__dirname, "..", "records.db"))

        /* Get the file for stream key */
        db.all(`SELECT file, by_user FROM stream_keys WHERE key = ?`, req.query["token"], (e, r)=>{

            /* Database Error */
            if (e) {
                send_error(res, "DBERR", e)
                return
            }

            /* Token not found */
            if (r.length === 0) {
                res.sendStatus(500)
                return
            }

            /* STREAMING LOGIC --starts */

            res.download(r[0].file, path.basename(r[0].file), (err) => {
                if (err) return;
            })

            /* -- ends */

            /* Emit event */
            emitter.emit("api:stream:Streaming", {
                user_id: r[0].user_id,
                file: path.basename(r[0].file)
            })

        })

    } else {
        res.status(400).send("DATA_X")
    }
}
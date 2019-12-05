/* Imports for all apis */
const { req_data_check, send_error } = require("../misc/randomfuncs")
const path = require("path")
const sqlite3 = require("sqlite3")

/* The file path must be absolute */
const { isPathAbs, pathExists } = require("../misc/randomfuncs")

module.exports = function (req, res, emitter) {

    /* We need "file" and "seen_till" */
    if ( req_data_check(req.body["file"]) && req_data_check(req.body["seen_till"]) && typeof req.body["seen_till"] === "number"
        && 0 <= req.body["seen_till"] && req.body["seen_till"] <= 100 ) {

        /* Path must be absolute */
        if( !isPathAbs(req.body["file"]) ) {
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

        // Storing into Database
        db.all(`SELECT COUNT(*) FROM watch_hist WHERE user_id = ? AND absolute_path = ?`, [ req.user_id, req.body["file"] ], 
        (e, r) => {

            /* Database Error */
            if (e) {
                send_error(res, "DBERR", e)
                return
            }

            /* User did not see this video before */
            if (r[0]["COUNT(*)"] === 0) {

                /* Insert new record */
                db.run(`INSERT INTO watch_hist (user_id, file_name, absolute_path, percent_watched) VALUES (?, ?, ?, ?)`, [
                    req.user_id,
                    path.basename(req.body["file"]),
                    req.body["file"],
                    req.body["seen_till"]
                ])

                res.sendStatus(200)

            }
            
            /* User saw this video before also */
            else {

                /* Update pre-existing record */
                db.run(`UPDATE watch_hist SET percent_watched = ? WHERE user_id = ? AND absolute_path = ?`, [
                    req.body["seen_till"],
                    req.user_id,
                    req.body["file"]
                ])

                res.sendStatus(200)

            }

            /* Emit Event */
            emitter.emit("api:updatewatching:UpdateWatched", {
                user_id: req.user_id,
                file: req.body["file"],
                percent: req.body["seen_till"]
            })
        })

    } 
    
    /* "file" and "seen_till" was not sent, or seen_till not in range */
    else
        res.status(400).send("DATA_X")
    
}
const path = require('path')
const sqlite3 = require('sqlite3')
const { resDataCheck, isPathAbs } = require("../misc/randomfuncs")

module.exports = function (req, res, emitter) {
    if (resDataCheck(req.body["file"]) && resDataCheck(req.body["seen_till"]) && typeof req.body["seen_till"] === "number"
        && 0 <= req.body["seen_till"] <= 100) {

        if(!isPathAbs(req.body["file"])) {
            res.status(400).send("PATH_NOT_ABS")
            return
        }

        var db = new sqlite3.Database(path.join(__dirname, '..', 'records.db'))

        // Storing into Database
        db.all(`SELECT COUNT(*) FROM watch_hist WHERE user_id = ? AND absolute_path = ?`, [
            req.user_id,
            req.body["file"]
        ], (_, r) => {

            if (r[0]["COUNT(*)"] === 0) {
                // Was not seeing this before

                db.run(`INSERT INTO watch_hist (user_id, file_name, absolute_path, percent_watched) VALUES (?, ?, ?, ?)`, [
                    req.user_id,
                    path.basename(req.body["file"]),
                    req.body["file"],
                    req.body["seen_till"]
                ])

            } else {

                db.run(`UPDATE watch_hist SET percent_watched = ? WHERE user_id = ? AND absolute_path = ?`, [
                    req.body["seen_till"],
                    req.user_id,
                    req.body["file"]
                ])

            }
        })

        
    } else {
        // Data not sent
        res.status(400).send("DATA_X")
    }
}
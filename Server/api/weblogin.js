const sqlite3 = require('sqlite3').verbose()
module.exports = function (req, res, emitter) {
    if (req.query["sessKey"] && typeof req.query["sessKey"] === "string") {
        var db = new sqlite3.Database('records.db')
        db.all("SELECT current_session_last_update_timestamp FROM sessions WHERE current_session_key = ?", req.query["sessKey"],
            (err, row) => {
                // No session or an expired session
                if (row.length === 0 || (row[0].current_session_last_update_timestamp - Date.now()) / (1000 * 60) > 30 ) {
                    res.sendStatus(400)
                } else {
                    req.session.loggedin = true
                    req.session.sessKey = req.query["sessKey"]
                    res.redirect("../home/")
                }
            })        
    } else {
        res.sendStatus(400)
    }
}
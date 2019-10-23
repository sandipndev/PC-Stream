const sqlite3 = require('sqlite3').verbose()

module.exports = function (req, res, emitter) {
    if (req.query["token"] && typeof req.query["token"] === "string") {
        var db = new sqlite3.Database('records.db')
        db.all(`SELECT account.user_name, stream_keys.file
        FROM stream_keys JOIN account ON stream_keys.by_user = account.user_id
        WHERE stream_keys.key = ?`, req.query["token"], (err, rows) => {
            if (rows.length === 0) {
                res.sendStatus(400)
            } else {
                res.render("web/videoembed.html", {
                    filename: rows[0].file,
                    vtoken: req.query["token"],
                    username: rows[0].user_name
                })
            }
        })

    } else {
        res.sendStatus(400)
    }
}
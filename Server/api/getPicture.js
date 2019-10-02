const sqlite3 = require('sqlite3').verbose()

module.exports = function ( req, res, emitter ) {
    if (req.body["session_key"] && typeof req.body["session_key"] === "string") {
        
        // DB checks
        var db = new sqlite3.Database('records.db')
        db.all(`SELECT user_pictures.profile_picture
        FROM user_pictures JOIN sessions ON sessions.user_id = user_pictures.user_id
        WHERE sessions.current_session_key = ?`, req.body["session_key"], (_, r1) => {

            // Session Key does not exists
            if (r1.length === 0) {
                res.status(400).send("SKEY_X")
                return
            }

            res.status(200).send({
                base64DP: r1[0].profile_picture
            })

        })

    } else {
        // Data not sent
        res.status(400).send("DATA_X")
    }
}
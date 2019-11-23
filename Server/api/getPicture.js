const sqlite3 = require('sqlite3').verbose()

module.exports = function ( req, res, emitter ) {
    // DB checks
    var db = new sqlite3.Database('records.db')
    db.all(`SELECT profile_picture
    FROM user_pictures
    WHERE user_id = ?`, req.user_id, (_, r1) => {

        // Session Key does not exists
        if (r1.length === 0) {
            res.status(400).send("SKEY_X")
            return
        }

        res.status(200).send({
            base64DP: r1[0].profile_picture,
            name: r1[0].real_name
        })

    })
}
const sqlite3 = require('sqlite3').verbose()

module.exports = function ( req, res, emitter ) {
    // DB checks
    var db = new sqlite3.Database('records.db')
    db.all(`SELECT user_pictures.profile_picture, account.real_name
    FROM user_pictures JOIN account ON user_pictures.user_id = account.user_id
    WHERE account.user_id = ?`, req.user_id, (_, r1) => {

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
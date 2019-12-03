/* Imports for all apis */
const { send_error } = require("../misc/randomfuncs")
const path = require("path")
const sqlite3 = require("sqlite3")

module.exports = function ( req, res, emitter ) {

    /* Database Object */
    let db = new sqlite3.Database(path.join(__dirname, "..", "records.db"))

    /* Get name and profile picture from database */
    db.all(`SELECT user_pictures.profile_picture, account.real_name
    FROM user_pictures JOIN account ON user_pictures.user_id = account.user_id
    WHERE account.user_id = ?`, req.user_id, (e, r) => {

        /* Database Error */
        if (e) {
            send_error(res, "DBERR", e)
            return
        }

        /* Send the data */
        res.status(200).send({
            base64DP: r[0].profile_picture,
            name: r[0].real_name
        })

        /* Closing database after database ops */
        db.close()
    })
}
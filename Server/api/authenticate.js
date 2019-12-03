/* Imports for all apis */
const { req_data_check, send_error } = require("../misc/randomfuncs")
const path = require("path")
const sqlite3 = require("sqlite3")

/* Hash for checking hashed password and we are using jwt auth */
const { createHash } = require("crypto")
const jwt = require("jsonwebtoken")

module.exports = function ( req, res, emitter, privateKey ) {
    
    /* Username and Password should be sent and of type Strings */
    if( req_data_check(req.body["username"]) && req_data_check(req.body["password"]) ) {

        /* Database Object */
        let db = new sqlite3.Database(path.join(__dirname, "..", "records.db"))

        /* Confirming User ID and Password */
        db.all(`SELECT account.user_id, account.salt, account.hashed_password, account.real_name, login_details.no_logins
        FROM account JOIN login_details ON account.user_id = login_details.user_id
        WHERE account.user_name = ?`, req.body["username"], (e, r) => {

            /* Database Error */
            if (e) {
                send_error(res, "DBERR", e)
                return
            }
            
            /* Check even if the user exists */
            if (r.length > 0) {

                /* Recreate the sha256 hashed password using salt */
                const hshpw = createHash("sha256").update(req.body["password"] + r[0].salt, "utf8").digest("hex")

                /* Password is correct */
                if (hshpw === r[0].hashed_password) {

                    /* Update number of logins */
                    db.run(`UPDATE login_details SET no_logins = ? WHERE user_id = ?`, [ r[0].no_logins+1, r[0].user_id ])

                    /* Sign with jwt token */
                    jwt.sign({
                        user_id: r[0].user_id
                    },  
                        privateKey, 
                        { expiresIn: "30m" },
                        (_, token) => {

                            /* Send the correct response */
                            res.status(200).send({
                                jwt_token: token,
                                no_logins: r[0].no_logins
                            })

                            /* Raise event for logged in user */
                            emitter.send("api:authenticate:LoggedIn", {
                                name: r[0].real_name,
                                id: r[0].user_id
                            })
                        }
                    )
                }

                /* Incorrect Password */
                else
                    res.status(403).send("PWORD_X")
            }
            
            /* Username not present in database */
            else 
                res.status(403).send("UNAME_X")

            /* Close the database */
            db.close()

        })

    }

    /* Username and Password were not sent */
    else 
        res.status(400).send("DATA_X")
    
}
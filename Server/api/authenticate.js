const sqlite3 = require('sqlite3').verbose()
const { randomBytes, createHash } = require('crypto')

module.exports = function ( req, res, emitter ) {
    
    if(req.body["username"] && req.body["password"] && typeof req.body["username"] === "string" && typeof req.body["password"] === "string") {

        // Username and Password are sent and of type Strings

        // Database checks
        var db = new sqlite3.Database('records.db')
        db.all(`SELECT user_id, salt, hashed_password FROM account WHERE user_name = ?`, req.body["username"], (_, r) => {
            
            // Check even if the user exists
            if (r.length > 0) {

                // Recreate the sha256 hashed password using salt
                const hshpw = createHash('sha256').update(req.body["password"] + r[0].salt, 'utf8').digest('hex')

                // Password is correct
                if (hshpw === r[0].hashed_password) {

                    // Check if there's a prexisting session key for the user
                    db.all(`SELECT current_session_key, current_session_last_update_timestamp FROM sessions WHERE user_id = ?`, r[0].user_id, (_, row)=>{

                        // No session or an expired session
                        if (row.length === 0 || (row[0].current_session_last_update_timestamp - Date.now()) / (1000 * 60) > 30 )  {

                            // Creating a new session key
                            const sessKey = randomBytes(10).toString('hex')

                            // Adding session key to database
                            db.all(`INSERT INTO sessions(user_id, current_session_key, current_session_last_update_timestamp) VALUES (?, ?, ?)`, [
                                r[0].user_id,
                                sessKey,
                                Date.now()
                            ], (err) => {
                                if (!err) {

                                    // No error occured while adding the new session key to database
                                    res.status(200).send({
                                        sessKey: sessKey
                                    })
                                } else {

                                    // Server error, database couldn't be written to for some reason
                                    res.sendStatus(500)
                                }
                            })
                        } else {

                            // Already existing valid session key
                            res.status(200).send({
                                sessKey: row[0].current_session_key
                            })
                        }
                    })
                }

                // Incorrect Password
                else
                    res.status(400).send("PWORD_X")
            }
            
            // Username not present in database
            else 
                res.status(400).send("UNAME_X")
        })

        db.close()

    } else {
        // Incorrect data
        res.status(400).send("DATA_X")
    }

}
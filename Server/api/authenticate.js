const sqlite3 = require('sqlite3').verbose()
const { createHash } = require('crypto')
const jwt = require('jsonwebtoken')

module.exports = function ( req, res, emitter, privateKey ) {
    
    if(req.body["username"] && req.body["password"] && typeof req.body["username"] === "string" && typeof req.body["password"] === "string"  && req.body["username"] !== "" && req.body["password"] !== "") {

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

                    jwt.sign({
                        user_id: r[0].user_id
                    },  
                        privateKey, 
                        { expiresIn: '30m' },
                        (_, token) => {
                            res.status(200).send(token)
                    })

                }

                // Incorrect Password
                else
                    res.status(403).send("PWORD_X")
            }
            
            // Username not present in database
            else 
                res.status(403).send("UNAME_X")
        })

        db.close()

    } else {
        // Incorrect data
        res.status(400).send("DATA_X")
    }

}
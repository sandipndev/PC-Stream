const sqlite3 = require('sqlite3').verbose()
const { randomBytes, createHash } = require('crypto')

exports.auth = function (uname, pword, res, emitter) {
    var db = new sqlite3.Database('records.db')

    db.all(`SELECT user_id, salt, hashed_password FROM account WHERE user_name = ?`, uname, (_, r) => {
        
        if (r.length > 0) {
            const hshpw = createHash('sha256').update(pword + r[0].salt, 'utf8').digest('hex')

            if (hshpw === r[0].hashed_password) {

                db.all(`SELECT current_session_key, current_session_last_update_timestamp FROM sessions WHERE user_id = ?`, r[0].user_id, (_, row)=>{
                    if (row.length === 0 || (row[0].current_session_last_update_timestamp - Date.now()) / (1000 * 60) > 30 )  {
                        const sessKey = randomBytes(10).toString('hex')

                        db.all(`INSERT INTO sessions(user_id, current_session_key, current_session_last_update_timestamp) VALUES (?, ?, ?)`, [
                            r[0].user_id,
                            sessKey,
                            Date.now()
                        ], (err) => {
                            if (!err) {
                                res.status(200).send({
                                    sessKey: sessKey
                                })
                            } else {
                                res.sendStatus(500)
                            }
                        })
                    } else {
                        res.status(200).send({
                            sessKey: row[0].current_session_key
                        })
                    }
                })

                // emitter.emit("usr:authenticated", uname)

            }
            else
                res.status(400).send("PWORD_X")
        }
        
        else 
            res.status(400).send("UNAME_DNE")
    })

    db.close()
}
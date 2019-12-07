/* Imports to get a dp */
const sqlite3 = require('sqlite3')
const path = require('path')

module.exports = function (id) {
    return new Promise((resolve, reject) => {
        var db = new sqlite3.Database(path.join(__dirname, '..', '..', 'records.db'))
        db.all(`SELECT real_name FROM account WHERE user_id = ?`, [ id ], (e, r) => {
            if (!e) {
                db.close()
                resolve(r[0].real_name)
            } else {
                reject(e)
            }
        })
    })
    
}
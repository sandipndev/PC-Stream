/* Imports to get a dp */
const sqlite3 = require('sqlite3')
const path = require('path')

module.exports = function (api, data) {
    var db = new sqlite3.Database(path.join(__dirname, '..', '..', 'records.db'))
    db.run(`INSERT INTO log_data(timestamp, api, data) VALUES(?, ?, ?)`, [ Date.now(), api, JSON.stringify(data) ])
    db.close()
}
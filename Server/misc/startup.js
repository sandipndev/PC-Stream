// To create databases
const sqlite3 = require('sqlite3')
const path = require('path')
const { randomBytes } = require('crypto')

module.exports.initDbAndGetPrivateKey = function() {

    return new Promise((resolve, _) => {

        var db = new sqlite3.Database(path.join(__dirname, '..', 'records.db'))

        db.serialize(()=> {
            db.run(`CREATE TABLE IF NOT EXISTS "account" (
                "user_id"	INTEGER PRIMARY KEY AUTOINCREMENT,
                "user_name"	TEXT,
                "real_name" TEXT,
                "salt"	TEXT,
                "hashed_password"	TEXT
            );`)

            db.run(`CREATE TABLE IF NOT EXISTS "stream_keys" (
                "key"   TEXT PRIMARY KEY,
                "by_user"   INTEGER,
                "file"  TEXT
            );"`)

            db.run(`DELETE FROM "stream_keys"`)

            db.run(`CREATE TABLE IF NOT EXISTS "user_pictures" (
                "user_id" 	INTEGER PRIMARY KEY,
                "profile_picture"	TEXT
            );`)

            db.run(`CREATE TABLE IF NOT EXISTS "permissions" (
                "user_id"	INTEGER PRIMARY KEY,
                "can_download"	INTEGER,
                "can_rename"	INTEGER,
                "can_delete"	INTEGER,
                "can_upload"    INTEGER,
                "can_rce"       INTEGER,
                "folders_unallowed"		TEXT
            );`)

            db.run(`CREATE TABLE IF NOT EXISTS "login_details" (
                "user_id"	INTEGER PRIMARY KEY,
                "no_logins"		INTEGER
            );`)

            db.run(`CREATE TABLE IF NOT EXISTS "watch_hist" (
                "user_id"	INTEGER PRIMARY KEY,
                "file_name"		TEXT,
                "absolute_path"		TEXT,
                "percent_watched"   REAL
            );`)

            db.run(`CREATE TABLE IF NOT EXISTS "ip_port_pkey" (
                "ip"	TEXT,
                "port"	TEXT,
                "private_key"   TEXT
            );`)

            db.all(`SELECT private_key FROM ip_port_pkey`, (_, r) => {
                let pKey
                if (r.length === 0) {
                    pKey = randomBytes(32).toString('hex')
                    db.run(`INSERT INTO ip_port_pkey(private_key) VALUES (?)`, pKey)
                } else {
                    pKey = r[0]["private_key"]
                }

                db.close()

                resolve(pKey)

            })

        })

    })

}
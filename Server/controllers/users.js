// NewUser object: real_name, user_name, plaintext_password, allow_downloads, allow_rename, allow_deletions, dont_allow_these_dirs, picture_base64

// Database Connection
const sqlite3 = require('sqlite3').verbose()
var db = new sqlite3.Database('records.db')

// For Salts
const { randomBytes, createHash } = require('crypto')

exports.add_user = function(new_user) {

    // Generate salt
    const salt = randomBytes(10).toString('hex')

    // Hashed password
    const full_password = new_user.plaintext_password + salt
    const hashed_password = createHash('sha256').update(full_password, 'utf8').digest('hex')

    // UPDATE THE DATABASES
    
    // TABLE 'account'
    db.run(`INSERT INTO account(user_name, real_name, salt, hashed_password) VALUES (?, ?, ?, ?)`, [
        new_user.user_name,
        new_user.real_name,
        salt,
        hashed_password
    ])

    db.all(`SELECT user_id FROM account WHERE hashed_password = ?`, hashed_password, (err, rows) => {
        const user_id = rows[0].user_id

        db.run(`INSERT INTO user_pictures(user_id, profile_picture) VALUES (?, ?)`, [
            user_id,
            new_user.picture_base64
        ])
    })
}
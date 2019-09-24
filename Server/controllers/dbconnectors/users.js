// NewUser object: real_name, user_name, plaintext_password, allow_downloads, allow_rename, allow_deletions, dont_allow_these_dirs, picture_base64

// Database Connection
const sqlite3 = require('sqlite3').verbose()

// For Salts
const { randomBytes, createHash } = require('crypto')

exports._get_user_id = function (user_name) {
    var db = new sqlite3.Database('records.db')

    db.each(`SELECT * FROM account WHERE user_name = ?`, user_name, (err, rows) => {
        console.log(rows)
    })

    db.close()
}

exports.add_user = function(new_user) {

    var db = new sqlite3.Database('records.db')

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

        db.run(`INSERT INTO permissions(user_id, can_download, can_rename, folders_unallowed) VALUES (?, ?, ?, ?)`, [
            user_id,
            new_user.allow_downloads ? 1 : 0,
            new_user.allow_rename ? 1 : 0,
            new_user.allow_deletions ? 1 : 0,
            JSON.stringify(new_user.dont_allow_these_dirs)
        ])

        db.run(`INSERT INTO login_details(user_id, no_logins)`, [
            user_id,
            0
        ])
    })

    db.close()
}

exports.edit_user_perms = function(existing_user_changes) {

    var db = new sqlite3.Database('records.db')

    // Update permissions
    db.run(`UPDATE permissions SET can_download = ?, can_rename = ?, can_delete = ?, folders_unallowed = ? WHERE user_id = ?`, [
        existing_user_changes.allow_downloads ? 1 : 0,
        existing_user_changes.allow_rename ? 1 : 0,
        existing_user_changes.allow_deletions ? 1 : 0,
        JSON.stringify(existing_user_changes.dont_allow_these_dirs),
        existing_user_changes.user_id
    ])

    db.close()
}

exports.edit_user_password = function(existing_user_changes) {

    var db = new sqlite3.Database('records.db')

    // Generate salt
    const salt = randomBytes(10).toString('hex')

    // Construct full password
    const full_password = existing_user_changes.plaintext_password + salt
    const hashed_password = createHash('sha256').update(full_password, 'utf8').digest('hex')

    db.run(`UPDATE account SET salt = ?, hashed_password = ? WHERE user_id = ?`, [
        salt,
        hashed_password,
        existing_user_changes.user_id
    ])

    db.close()
}

exports.delete_user = function(existing_user) {

    var db = new sqlite3.Database('records.db')

    // Delete an user
    db.run(`DELETE FROM account WHERE user_id = ?`, [
        existing_user.user_id
    ])

    db.run(`DELETE FROM sessions WHERE user_id = ?`, [
        existing_user.user_id
    ])

    db.run(`DELETE FROM user_pictures WHERE user_id = ?`, [
        existing_user.user_id
    ])

    db.run(`DELETE FROM permissions WHERE user_id = ?`, [
        existing_user.user_id
    ])

    db.run(`DELETE FROM login_details WHERE user_id = ?`, [
        existing_user.user_id
    ])

    db.run(`DELETE FROM watch_hist WHERE user_id = ?`, [
        existing_user.user_id
    ])
}


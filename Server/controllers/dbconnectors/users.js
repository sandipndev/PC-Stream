// NewUser object: real_name, user_name, plaintext_password, picture_base64

// Database Connection
const sqlite3 = require('sqlite3')
const path = require('path')

// For Salts
const { randomBytes, createHash } = require('crypto')

exports.check_uname_conflict_and_add = function (new_user, emitter) {
    var db = new sqlite3.Database(path.join(__dirname, '..', '..', 'records.db'))

    db.all('SELECT user_name FROM account', (_, row) => {
        
        for (var i=0; i<row.length; i++) {
            if (row[i].user_name === new_user.user_name) {
                emitter.send("toast-trig", `Username ${new_user.user_name} already exists!`, "danger")
                emitter.send("notif-trig", `Profile for ${new_user.real_name} not added due to username conflict`)
                return
            }
        }
        exports.add_user(new_user)
        emitter.send("notif-trig", `Profile for ${new_user.real_name} added`)
        emitter.send("toast-trig", `User ${new_user.user_name} added`, "success")
    })

    db.close()
}

exports.user_list_update = function (emitter) { 
    var db = new sqlite3.Database(path.join(__dirname, '..', '..', 'records.db'))

    db.all('SELECT user_name FROM account', (_, row) => {
        emitter.send("listupdate:user", row)
    })

    db.close()
}

exports.add_user = function(new_user) {

    var db = new sqlite3.Database(path.join(__dirname, '..', '..', 'records.db'))

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

        db.run(`INSERT INTO permissions(user_id, can_download, can_rename, can_delete, can_upload, can_rce, folders_unallowed) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
            user_id,
            1,
            0,
            0,
            0,
            0,
            JSON.stringify([])
        ])

        db.run(`INSERT INTO login_details(user_id, no_logins) VALUES (?, ?)`, [
            user_id,
            0
        ])
    })

    db.close()
}

exports.display_user_perms = function (uname, emitter) { 
    var db = new sqlite3.Database(path.join(__dirname, '..', '..', 'records.db'))

    db.all('SELECT can_download, can_rename, can_delete, can_upload, can_rce, folders_unallowed FROM account JOIN permissions ON account.user_id = permissions.user_id WHERE user_name = ?', uname, (_, row) => {
        emitter.send("user:displayPerms", row, uname)
    })

    db.close()
}

exports.edit_user_perms = function(existing_user_changes, emitter) {

    var db = new sqlite3.Database(path.join(__dirname, '..', '..', 'records.db'))

    if (process.platform == 'win32') {
        for (var i=0; i<existing_user_changes.folders_unallowed.length; i++) {
            existing_user_changes.folders_unallowed[i] = existing_user_changes.folders_unallowed[i].replace(/\\/g, "/")
        }
    }

    existing_user_changes.folders_unallowed = JSON.stringify(existing_user_changes.folders_unallowed)

    // Update permissions
    db.all(`SELECT user_id, real_name FROM account WHERE user_name = ?`, existing_user_changes.user_name, (_, row)=>{
        db.run(`UPDATE permissions SET can_download = ?, can_rename = ?, can_delete = ?, can_upload = ?, can_rce = ?, folders_unallowed = ? WHERE user_id = ?`, [
            existing_user_changes.can_download ? 1 : 0,
            existing_user_changes.can_rename ? 1 : 0,
            existing_user_changes.can_delete ? 1 : 0,
            existing_user_changes.can_upload ? 1 : 0, 
            existing_user_changes.can_rce ? 1 : 0,
            existing_user_changes.folders_unallowed,
            row[0].user_id
        ], ()=>{
            emitter.send("toast-trig", `User ${existing_user_changes.user_name}'s permissions updated`, "success")
            emitter.send("notif-trig", `Permissions for ${row[0].real_name} updated`)
        })
    })

    db.close()
}

exports.edit_user_password = function(existing_user_changes, emitter) {

    var db = new sqlite3.Database(path.join(__dirname, '..', '..', 'records.db'))

    // Generate salt
    const salt = randomBytes(10).toString('hex')

    // Construct full password
    const full_password = existing_user_changes.plaintext_password + salt
    const hashed_password = createHash('sha256').update(full_password, 'utf8').digest('hex')

    db.all(`SELECT user_id, real_name FROM account WHERE user_name = ?`, existing_user_changes.user_name, (_, row) => {

        db.run(`UPDATE account SET salt = ?, hashed_password = ? WHERE user_id = ?`, [
            salt,
            hashed_password,
            row[0].user_id
        ])

        emitter.send("toast-trig", `User ${existing_user_changes.user_name}'s password updated`, "info")
        emitter.send("notif-trig", `Password for ${row[0].real_name} updated`)

    })

    db.close()
}

exports.delete_user = function(existing_user, emitter) {

    var db = new sqlite3.Database(path.join(__dirname, '..', '..', 'records.db'))

    db.all(`SELECT user_id, real_name FROM account WHERE user_name = ?`, existing_user.user_name, (_, row) => {

        // Delete an user
        db.run(`DELETE FROM account WHERE user_id = ?`, [
            row[0].user_id
        ])

        db.run(`DELETE FROM sessions WHERE user_id = ?`, [
            row[0].user_id
        ])

        db.run(`DELETE FROM user_pictures WHERE user_id = ?`, [
            row[0].user_id
        ])

        db.run(`DELETE FROM permissions WHERE user_id = ?`, [
            row[0].user_id
        ])

        db.run(`DELETE FROM login_details WHERE user_id = ?`, [
            row[0].user_id
        ])

        db.run(`DELETE FROM watch_hist WHERE user_id = ?`, [
            row[0].user_id
        ])

        emitter.send("user:delDone")
        emitter.send("toast-trig", `User ${existing_user.user_name} deleted`, "danger")
        emitter.send("notif-trig", `Profile for ${row[0].real_name} deleted successfully`)
    })
}


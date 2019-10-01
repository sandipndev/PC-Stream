const sqlite3 = require('sqlite3').verbose()

module.exports = function ( req, res, emitter ) {
    if(req.body["session_key"] && req.body["dir"] && typeof req.body["session_key"] === "string" && typeof req.body["dir"] === "string") {
        
        // Username and Password are sent and of type Strings

        // Database checks
        var db = new sqlite3.Database('records.db')
        db.all(`SELECT permissions.folders_unallowed
        FROM sessions JOIN permissions ON permissions.user_id = sessions.user_id 
        WHERE current_session_key = ?`, req.body["session_key"], (_, r1)=> {

            // Session Key does not exists
            if (r1.length === 0) {
                res.status(400).send("SKEY_X")
                return
            }

            let unallowed_dirs = JSON.parse(r1[0].folders_unallowed)

            if (process.platform == 'win32') {
                for (var i=0; i<unallowed_dirs.length; i++) {
                    unallowed_dirs[i] = unallowed_dirs[i].replace(/\//g, "\\")
                }
            }

            // Session Key exists and correct
            console.log(unallowed_dirs)

            var response = {}
            response["files"] = []
            response["folders"] = []

            res.sendStatus(200)
        })

        // Closing database after database ops
        db.close()
    } else {
        // Data not sent
        res.status(400).send("DATA_X")
    }
}
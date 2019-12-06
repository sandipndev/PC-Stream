/* Imports for all apis */
const { req_data_check, send_error } = require("../misc/randomfuncs")
const path = require("path")
const sqlite3 = require("sqlite3")

/* To exec commands */
const { sh } = require("../misc/randomfuncs")

/* List of appropriate commands */
let commands
if (process.platform === "win32") {
    commands = {
        "shutdown": "shutdown /s"
    }
} else {
    commands = {
        "shutdown": "shutdown -h 1"
    }
}

module.exports =  function (req, res, emitter) {

    /* A command needs to be sent */
    if ( req_data_check(req.body["command"]) ) {

        /* Database Object */
        let db = new sqlite3.Database(path.join(__dirname, "..", "records.db"))

        /* Get the execute command permission */
        db.all(`SELECT can_rce FROM permissions WHERE user_id = ?`, req.user_id,
        (e, r) => {

            /* Database Error */
            if (e) {
                send_error(res, "DBERR", e)
                return
            }

            /* No perms */
            if (r[0].can_rce === 0) {
                res.status(400).send("CANT_EXEC")
                return
            }

            /* This command doesn't exist */
            if (!commands[req.body["command"]]) {
                res.status(400).send("CMD_X")
                return
            }

            /* Execute command */
            sh(commands[req.body["command"]])
            .then(({stdout, stderr}) => {
                
                /* Return result */
                res.status(200).send({
                    success: true,
                    stdout,
                    stderr
                })

                /* Emit Event */
                emitter.emit("api:trycommand:CommandExecuted", {
                    user_id: req.user_id,
                    command: req.body["command"]
                })

            })
            .catch((e) => {

                /* Error */
                send_error(res, "CMDEXECERR", e)

            })
        })
    } 
    
    /* Command was not sent */
    else
        res.status(400).send("DATA_X")

}
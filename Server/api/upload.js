/* Imports for all apis */
const { req_data_check, send_error } = require("../misc/randomfuncs")
const path = require("path")
const sqlite3 = require("sqlite3")

module.exports = function (req, res, emitter) {

    /* A file and a move to point to be sent */
    if ( req_data_check(req.body["moveTo"]) && !!req.files["file"] ) {

        

    }

    /* The file or the location not sent */
    else
        res.status(400).send("DATA_X")

    let to = req.body["moveTo"]
    const file = req.files["file"]
    to = path.join(to, file["name"])

    console.log(to)

    file.mv(to, (e) => {
        console.log(e)
    })
    
    res.sendStatus(200)

}
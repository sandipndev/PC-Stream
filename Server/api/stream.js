const path = require('path')
const sqlite3 = require('sqlite3')

module.exports = function ( req, res, emitter ) {
    if (resDataCheck(req.query["token"])) {

        // DB Checks
        var db = new sqlite3.Database(path.join(__dirname, '..', 'records.db'))
        db.all(`SELECT file, by_user FROM stream_keys WHERE key = ?`, req.query["token"], (e, r1)=>{
            if (!e) {

                /* STREAMING LOGIC --starts */

                res.download(r1[0].file, path.basename(r1[0].file), (err) => {
                    if (err) return;
                })

                /* -- ends */

            } else {
                res.status(400).send("TOKEN_X")
            }
        })

    } else {
        res.status(400).send("DATA_X")
    }
}
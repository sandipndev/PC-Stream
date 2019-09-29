const { auth } = require("../controllers/dbconnectors/apiconnect")

module.exports = function ( req, res, emitter ) {
    
    if(req.body["username"] && req.body["password"] && typeof req.body["username"] === "string" && typeof req.body["password"] === "string") {
        auth(req.body["username"], req.body["password"], res, emitter)
    } else {
        res.sendStatus(400)
    }

}
module.exports = function ( req, res, emitter ) {
    
    if(req.body["username"] && req.body["password"] && typeof req.body["username"] == "string" && typeof req.body["password"] == "string") {
        console.log(req.body["username"], req.body["password"])
        res.sendStatus(200)
    } else {
        res.sendStatus(400)
    }

}
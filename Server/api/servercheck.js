module.exports = function (_, res, emitter) {  
    res.status(200).send(`PC Stream, ${process.platform}`)
}

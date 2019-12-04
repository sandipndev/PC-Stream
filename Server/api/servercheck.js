module.exports = function (_, res) {  
    /* The purpose of this is to be able to scan and verify that PC Stream is running */
    res.status(200).send(`PC Stream, ${process.platform}`)
}
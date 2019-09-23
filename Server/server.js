const express = require('express')
const exapp = express()

const EventEmitter = require('events');
const emitter = new EventEmitter();

let server
let serverState = 0

exapp.get('/', (_, res) => {
    res.send("Hhahaha")
})

exports.toggleServer = function (port_no) {
    if (serverState === 0) {
        server = exapp.listen(port_no, ()=>console.log(`Server running on port ${port_no}`))
        serverState = 1
        return true
    } else {
        server.close()
        console.log(`Server stopped`)
        serverState = 0
        return false
    }
}
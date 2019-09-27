const BodyParser = require('body-parser');
const express = require('express')
const exapp = express()

exapp.ip = require('ip').address();

const EventEmitter = require('events')
const emitter = new EventEmitter()

const { authenticate,
        deletex,
        download,
        getdir,
        getdownload,
        getstream,
        recursivemediasearch,
        rename,
        stream } = require("../api")

let server
let serverState = 0

exapp.post('/authenticate', (req, res) => {
    authenticate(req, res, emitter)
})

exapp.post('/delete', (req, res) => {
    deletex(req, res, emitter)
})

exapp.get('/download', (req, res) => {
    download(req, res, emitter)
})

exapp.post('/getdir', (req, res) => {
    getdir(req, res, emitter)
})

exapp.post('/getdownload', (req, res) => {
    getdownload(req, res, emitter)
})

exapp.post('/getstream', (req, res) => {
    getstream(req, res, emitter)
})

exapp.post('/recurmediascan', (req, res) => {
    recursivemediasearch(req, res, emitter)
})

exapp.post('/rename', (req, res) => {
    rename(req, res, emitter)
})

exapp.get('/stream', (req, res) => {
    stream(req, res, emitter)
})

exports.get_server_state = () => {
    return serverState?"on":"off"
}

exports.toggleServer = function (port_no) {
    exapp.port = port_no
    if (serverState === 0) {
        server = exapp.listen(port_no)
        serverState = 1
        return [ true, exapp.ip, exapp.port ]
    } else {
        server.close()
        serverState = 0
        return [ false ]
    }
}
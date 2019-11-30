const BodyParser = require('body-parser')
const express = require('express')
const exapp = express()
const jwt = require('jsonwebtoken')

// To jsonify every request
exapp.use(BodyParser.json());
exapp.use(BodyParser.urlencoded({ extended: true }));
exapp.use(function (err, _, res, _) {
	if (err) {
		res.status(500).send('JSON_INCORRECT')
		return
	}
})

exapp.ip = require('ip').address()

const EventEmitter = require('events')
const emitter = new EventEmitter()

let privateKey

exports.setPrivateKey = function setPrivateKey(pKey) {
    privateKey = pKey
}

const { authenticate,
        deletex,
        getdir,
        getstream,
        recursivemediasearch,
        rename,
        stream,
        getPicture,
        servercheck,
        getFileInfo,
        updateWatching,
        getVideoThumbnail } = require("../api")

let server
let serverState = 0

// ------------------- API CALLS --------------------

exapp.post('/api/authenticate', (req, res) => {
    authenticate(req, res, emitter, privateKey)
})

exapp.post('/api/delete', verifyToken, (req, res) => {
    deletex(req, res, emitter)
})

exapp.post('/api/get-dir', verifyToken, (req, res) => {
    getdir(req, res, emitter)
})

exapp.post('/api/get-stream', verifyToken, (req, res) => {
    getstream(req, res, emitter)
})

exapp.post('/api/recur-media-scan', verifyToken, (req, res) => {
    recursivemediasearch(req, res, emitter)
})

exapp.post('/api/rename', verifyToken, (req, res) => {
    rename(req, res, emitter)
})

exapp.get('/stream', (req, res) => {
    stream(req, res, emitter)
})

exapp.post('/api/get-user-data', verifyToken, (req, res) => {
    getPicture(req, res, emitter)
})

exapp.get('/api/server-check', (req, res) => {
    servercheck(req, res, emitter)
})

exapp.post('/api/get-file-info', verifyToken, (req, res) => {
    getFileInfo(req, res, emitter)
})

exapp.post('/api/update-watching', verifyToken, (req, res) => {
    updateWatching(req, res, emitter)
})

exapp.post('/api/get-video-thumbnail', verifyToken, (req, res) => {
    getVideoThumbnail(req, res, emitter)
})

// Verify Token
function verifyToken(req, res, next) {
    // Get auth header value
    const bearerHeader = req.headers['authorization'];

    // Check if bearer is undefined
    if(typeof bearerHeader !== 'undefined') {
      // Split at the space
      const bearer = bearerHeader.split(' ');

      // Get token from array
      const bearerToken = bearer[1];

      jwt.verify(bearerToken, privateKey, (err, authData) => {
        if (err) {
            res.sendStatus(403)
        } else {

            req.user_id = authData["user_id"]

            // Next middleware
            next();
        }
      })

    } else {
      // Forbidden
      res.sendStatus(403)
    }
  
}

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

exports.server_emitter = emitter
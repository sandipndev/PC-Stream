const BodyParser = require('body-parser')
const express = require('express')
const exapp = express()
const path = require('path')
const session = require('express-session')

// To jsonify every request
exapp.use(BodyParser.json());
exapp.use(BodyParser.urlencoded({ extended: true }));
exapp.use(function (err, _, res, _) {
	if (err) {
		res.status(500).send('JSON_INCORRECT')
		return
	}
})

// For sessions
exapp.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}))

// Engine
exapp.engine('html', require('ejs').renderFile)

// Statics
exapp.use("/css", express.static(path.join(__dirname, "..", "views", "web", "css")))
exapp.use("/assets", express.static(path.join(__dirname, "..", "views", "web", "assets")))
exapp.use("/js", express.static(path.join(__dirname, "..", "views", "web", "js")))

exapp.ip = require('ip').address()

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
        stream,
        getPicture,
        servercheck,
        getFileInfo } = require("../api")

const { weblogin } = require('../api/webapi')

let server
let serverState = 0

// -------------- WEBPAGE CALLS -------------------

exapp.get('/', (req, res) =>  {
    if (req.session.loggedin) {
        res.redirect("../home")
        return
    } else {
        if (req.query["lout"] == 1) {
            res.render(path.join(__dirname, "..", "views", "web", "index.html"), {
                louthtm: `You've been successfully logged out!`
            })
        } else {
            res.render(path.join(__dirname, "..", "views", "web", "index.html"), {
                louthtm: ""
            })
        }
    }
})

exapp.get('/weblogin', (req, res) => {
    weblogin(req, res, emitter)
})

exapp.get('/home', (req, res) => {
    if (req.session.loggedin) {
        res.render(path.join(__dirname, "..", "views", "web", "home.html"), {
            sessKey: req.session.sessKey
        })
    } else {
        res.redirect("../")
    }
})

exapp.get('/logout', (req, res) => {
    req.session.loggedin = false
    req.session.sessKey = null
    res.redirect("../?lout=1")
})

// ------------------- API CALLS --------------------

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

exapp.post('/getPicture', (req, res) => {
    getPicture(req, res, emitter)
})

exapp.get('/servercheck', (req, res) => {
    servercheck(req, res, emitter)
})

exapp.post('/getFileInfo', (req, res) => {
    getFileInfo(req, res, emitter)
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

exports.server_emitter = emitter
const {app, BrowserWindow, ipcMain} = require('electron')
const path = require('path')
const url = require('url')

// Database
const sqlite3 = require('sqlite3').verbose()
var db = new sqlite3.Database('records.db')

// Get databases working if not exists
const startup = require("./misc/startup")
startup(db)

// Test
const { add_user } = require('./controllers/users')
add_user({
    user_name: 'Sandipan',
    real_name: 'Sandipan Dey',
    plaintext_password: 'password',
    picture_base64: 'ehnbfbejhkfbjhefbjhefbjhb'
})

// --- ELECTRON APP --
app.on("ready", ()=> {
    let mainWindow = new BrowserWindow({
        height: 800,
        width: 800,
        show: false
    })

    mainWindow.loadURL(url.format({
        pathname:   path.join(__dirname, 'views', 'app', 'main.html'),
        protocol:   'file',
        slashes:    true
    }))

    mainWindow.once('ready-to-show', ()=> {
        mainWindow.show()
    })
})

app.on('window-all-closed', ()=>{ 
    app.quit()
    db.close()
 })
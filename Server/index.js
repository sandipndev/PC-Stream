const {app, BrowserWindow, ipcMain} = require('electron')
const path = require('path')
const url = require('url')

// Database
const sqlite3 = require('sqlite3').verbose()
var db = new sqlite3.Database('records.db')

// Server
const { toggleServer } = require('./server')

let mainWindow

// --- ELECTRON APP --
app.on("ready", ()=> {
    mainWindow = new BrowserWindow({
        height: 600,
        width: 600,
        minHeight: 600,
        minWidth: 600,
        show: false,
        frame: false,
        webPreferences: {
            nodeIntegration: true
        }
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

ipcMain.on("toggle-server", () => {
    let serverState = toggleServer(5400)
    mainWindow.webContents.send("server-state", serverState?"on":"off")
})
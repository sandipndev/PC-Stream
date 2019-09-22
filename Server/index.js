const {app, BrowserWindow, ipcMain} = require('electron')
const path = require('path')
const url = require('url')

// Express

// Database
const sqlite3 = require('sqlite3').verbose()
var db = new sqlite3.Database('records.db')

let mainWindow
let serverState = 0

// --- ELECTRON APP --
app.on("ready", ()=> {
    mainWindow = new BrowserWindow({
        height: 800,
        width: 1200,
        minHeight: 600,
        minWidth: 1000,
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
    if (serverState == 0) {
        serverState = 1
    } else {
        serverState = 0
    }
    mainWindow.webContents.send("server-state", (serverState==1)?"on":"off")
})
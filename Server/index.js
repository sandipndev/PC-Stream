const {app, BrowserWindow, ipcMain} = require('electron')
const path = require('path')
const url = require('url')

// Database
const sqlite3 = require('sqlite3').verbose()
var db = new sqlite3.Database('records.db')

let mainWindow

// --- ELECTRON APP --
app.on("ready", ()=> {
    mainWindow = new BrowserWindow({
        height: 800,
        width: 1200,
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
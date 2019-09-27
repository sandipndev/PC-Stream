const {app, BrowserWindow, ipcMain, Menu} = require('electron')
const path = require('path')
const url = require('url')

// Database
const sqlite3 = require('sqlite3').verbose()
var db = new sqlite3.Database('records.db')

// Server
const { toggleServer, get_server_state } = require('./controllers/server')
const { add_user } = require('./controllers/dbauth')

// Other vars
let mainWindow
const { menu_template, menu_click_emitter } = require('./misc/app_menu')

// Do dbs
const startup_db = require('./misc/startup')
startup_db(db)

// --- ELECTRON APP --
app.on("ready", ()=> {
    mainWindow = new BrowserWindow({
        height: 640,
        width: 800,
        minHeight: 640,
        minWidth: 800,
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
    if (get_server_state() === "on") {
        toggleServer(5400)
    }
    app.quit()
    db.close()
})

ipcMain.on("toggle-server", () => {
    let serverState = toggleServer(5400)
    if (serverState[0]) {
        mainWindow.webContents.send("server-state", "on", serverState[1], serverState[2])
    } else {
        mainWindow.webContents.send("server-state", "off")
    }
})

ipcMain.on('display-app-menu', (_, arg) => {
    const appMenu = Menu.buildFromTemplate(menu_template)
    if(mainWindow) {
      appMenu.popup(mainWindow, arg.x, arg.y)
    }
})

menu_click_emitter.on("menu-click", (event) => {
    mainWindow.webContents.send("menu-click", event)
})

ipcMain.on("user:add", (_, new_user) => {
    add_user(new_user)
})
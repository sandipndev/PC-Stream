const {app, BrowserWindow, ipcMain, Menu, dialog} = require('electron')
const path = require('path')
const url = require('url')

// Database
const sqlite3 = require('sqlite3').verbose()
var db = new sqlite3.Database('records.db')

// Server
const { toggleServer, get_server_state, setPrivateKey } = require('./controllers/server')
const { check_uname_conflict_and_add, user_list_update, display_user_perms, edit_user_perms, edit_user_password,
        delete_user } = require('./controllers/dbauth')

// Other vars
let mainWindow
const { menu_template, menu_click_emitter } = require('./misc/app_menu')
const port = 5456

// Do dbs
const { initDbAndGetPrivateKey } = require('./misc/startup')
initDbAndGetPrivateKey().then(pKey => {
    setPrivateKey(pKey)
})

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

function turn_off () { 
    if (get_server_state() === "on") {
        toggleServer(port)
    }
    app.quit()
    db.close()
}

app.on('window-all-closed', turn_off )

// Event triggers

ipcMain.on("toggle-server", () => {
    let serverState = toggleServer(port)
    if (serverState[0]) {
        mainWindow.webContents.send("server-state", "on", serverState[1], serverState[2])
        mainWindow.webContents.send("notif-trig", "Server online")
    } else {
        mainWindow.webContents.send("server-state", "off")
        mainWindow.webContents.send("notif-trig", "Server offline")
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
    check_uname_conflict_and_add(new_user, mainWindow.webContents)
    mainWindow.webContents.send("menu-click", "home-section")
})

ipcMain.on("user:listUpdate", ()=> {
    user_list_update(mainWindow.webContents)
})

ipcMain.on("displayPerms:user", (_, uname) => {
    display_user_perms(uname, mainWindow.webContents)
})

ipcMain.on("open:folder", () => {
    dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    }, path => mainWindow.webContents.send("folder:open", path))
})

ipcMain.on("perms:updated", (_, data)=> {
    edit_user_perms(data, mainWindow.webContents)
})

ipcMain.on("user:changepw", (_, uname, newps) => {
    edit_user_password({plaintext_password: newps, user_name: uname}, mainWindow.webContents)
})

ipcMain.on("user:del", (_, uname) => {
    delete_user({user_name: uname}, mainWindow.webContents)
})

menu_click_emitter.on("quit-menu", ()=>{ turn_off() })
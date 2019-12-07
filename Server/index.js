const {app, BrowserWindow, ipcMain, Menu, dialog} = require('electron')
const path = require('path')
const url = require('url')

// Server
const { toggleServer, get_server_state, setPrivateKey, server_emitter } = require('./controllers/server')
const { check_uname_conflict_and_add, user_list_update, display_user_perms, edit_user_perms, edit_user_password,
        delete_user } = require('./controllers/dbauth')
const addLog = require('./controllers/dbconnectors/addLog')
const getDp = require('./controllers/dbconnectors/getDp')
const getNameFromId = require('./controllers/dbconnectors/getNameFromId')


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

server_emitter.on("api:authenticate:LoggedIn", (data) => {
    addLog("api:authenticate:LoggedIn", data)
    getDp(data.user_id).then((dp) => {
        mainWindow.webContents.send("addUserLive", data.user_id, data.name, dp)
    })
    const msg = `${data.name} just got authenticated`
    mainWindow.webContents.send("logMsg", msg)
})

server_emitter.on("api:getdir:ReqDir", (data) => {
    addLog("api:getdir:ReqDir", data)
    getNameFromId(data.user_id).then((name) => {
        const msg = `${name} listed directory ${data.dir}`
        mainWindow.webContents.send("logMsg", msg)
    })
   
})

server_emitter.on("api:getfileinfo:ReqInfo", (data) => {
    addLog("api:getfileinfo:ReqInfo", data)
    getNameFromId(data.user_id).then((name) => {
        const msg = `${name} requested information for ${data.file}`
        mainWindow.webContents.send("logMsg", msg)
    })
})

server_emitter.on("api:getpicture:ReqUser", (data) => {
    addLog("api:getpicture:ReqUser", data)
    getNameFromId(data.user_id).then((name) => {
        const msg = `${name} asked for his/her profile picture and name`
        mainWindow.webContents.send("logMsg", msg)
    })
})

server_emitter.on("api:getstream:AskedStream", (data) => {
    addLog("api:getstream:AskedStream", data)
    getNameFromId(data.user_id).then((name) => {
        const msg = `${name} has a stream key for ${data.file}`
        mainWindow.webContents.send("logMsg", msg)
    })
})

server_emitter.on("api:stream:Streaming", (data) => {
    addLog("api:stream:Streaming", data)
    getNameFromId(data.user_id).then((name) => {
        const msg = `${name} is streaming ${data.file}`
        mainWindow.webContents.send("logMsg", msg)
    })
})

server_emitter.on("api:delete:Deleted", (data) => {
    addLog("api:delete:Deleted", data)
    getNameFromId(data.user_id).then((name) => {
        const msg = `${name} has deleted ${data.file}`
        mainWindow.webContents.send("logMsg", msg)
    })
})

server_emitter.on("api:getvideothumbnail:SendThumbnail", (data) => {
    addLog("api:getvideothumbnail:SendThumbnail", data)
    getNameFromId(data.user_id).then((name) => {
        const msg = `${name} got a thumbnail for ${data.file}`
        mainWindow.webContents.send("logMsg", msg)
    })
})

server_emitter.on("api:recursivemediasearch:Searched", (data) => {
    addLog("api:recursivemediasearch:Searched", data)
    getNameFromId(data.user_id).then((name) => {
        const msg = `${name} got scanned media inside ${data.file}`
        mainWindow.webContents.send("logMsg", msg)
    })
})

server_emitter.on("api:rename:RenameFile", (data) => {
    addLog("api:rename:RenameFile", data)
    getNameFromId(data.user_id).then((name) => {
        const msg = `${name} just renamed from ${data.from} to ${data.to}`
        mainWindow.webContents.send("logMsg", msg)
    })
})

server_emitter.on("api:trycommand:CommandExecuted", (data) => {
    addLog("api:trycommand:CommandExecuted", data)
    getNameFromId(data.user_id).then((name) => {
        const msg = `${name} executed ${data.command}`
        mainWindow.webContents.send("logMsg", msg)
    })
})

server_emitter.on("api:upload:UploadDone", (data) => {
    addLog("api:upload:UploadDone", data)
    getNameFromId(data.user_id).then((name) => {
        const msg = `${name} uploaded ${data.file} to ${data.moveTo}`
        mainWindow.webContents.send("logMsg", msg)
    })
})

server_emitter.on("api:updatewatching:UpdateWatched", (data) => {
    addLog("api:updatewatching:UpdateWatched", data)
    getNameFromId(data.user_id).then((name) => {
        const msg = `${name} completed watching ${data.percent}% of ${data.file}`
        mainWindow.webContents.send("logMsg", msg)
    })
    mainWindow.webContents.send("updateUserLiveStatus", data.user_id)
})

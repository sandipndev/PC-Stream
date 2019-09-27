const { remote, ipcRenderer } = require('electron')

document.getElementById('minimize-btn').addEventListener('click', () => {
  remote.getCurrentWindow().minimize()
})

document.getElementById('max-rest-btn').addEventListener('click', () => {
  const currentWindow = remote.getCurrentWindow()
  if(currentWindow.isMaximized()) {
    currentWindow.unmaximize()
    document.getElementById('max-rest-btn').innerHTML = "&#128470;"
  } else {
    currentWindow.maximize()
    document.getElementById('max-rest-btn').innerHTML = "&#128471;"
  }
})

document.getElementById('close-btn').addEventListener('click', () => {
  remote.app.quit()
})

document.getElementById('toggle-server-btn').addEventListener('click', () => {
  ipcRenderer.send('toggle-server')
})

ipcRenderer.on('server-state', (_, state) => {
  if (state === 'on') {
    document.getElementById('status-text').innerText = "ONLINE"
    document.getElementById('status-dot-1').style.color = "#17CC60" 
    document.getElementById('status-dot-2').style.color = "#17CC60"
    document.getElementById('toggle-server-btn').innerText = "Stop Server"
    document.getElementById('toggle-server-btn').classList.remove("btn-dark")
    document.getElementById('toggle-server-btn').classList.add("btn-success")
  } else {
    document.getElementById('status-text').innerText = "OFFLINE"
    document.getElementById('status-dot-1').style.color = "#bbb"
    document.getElementById('status-dot-2').style.color = "#bbb"
    document.getElementById('toggle-server-btn').innerText = "Start Server"
    document.getElementById('toggle-server-btn').classList.remove("btn-success")
    document.getElementById('toggle-server-btn').classList.add("btn-dark")
  }
})

document.getElementById('hamburger-ico').addEventListener('click', (_) => {
  ipcRenderer.send('display-app-menu', {
    x: document.getElementById('hamburger-ico').getBoundingClientRect().left,
    y: document.getElementById('hamburger-ico').getBoundingClientRect().bottom
  })
})

ipcRenderer.on("menu-click", (_, event) => {
  if (event === "toggle-server") {
    ipcRenderer.send("toggle-server")
  } else if (event === "show-uac") {
    console.log("show uac")
  }
})
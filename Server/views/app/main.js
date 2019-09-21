const { remote, ipcRenderer } = require('electron')

document.getElementById('minimize-btn').addEventListener('click', () => {
  remote.getCurrentWindow().minimize()
})

document.getElementById('max-rest-btn').addEventListener('click', () => {
  const currentWindow = remote.getCurrentWindow()
  if(currentWindow.isMaximized()) {
    currentWindow.unmaximize()
  } else {
    currentWindow.maximize()
  }
})

document.getElementById('close-btn').addEventListener('click', () => {
  remote.app.quit()
})
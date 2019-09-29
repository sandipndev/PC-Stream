const { remote, ipcRenderer } = require('electron')

document.addEventListener("DOMContentLoaded", ()=> {

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

  ipcRenderer.on('server-state', (_, state, ip, port) => {
    if (state === 'on') {
      document.getElementById('status-text').innerText = "ONLINE"
      document.getElementById('status-dot-1').style.color = "#17CC60" 
      document.getElementById('status-dot-2').style.color = "#17CC60"
      document.getElementById('toggle-server-btn').innerText = "Stop Server"
      document.getElementById('toggle-server-btn').classList.remove("btn-dark")
      document.getElementById('toggle-server-btn').classList.add("btn-success")
      document.getElementById('ip-placeholder').innerText = ip
      document.getElementById('port-placeholder').innerText = port
      document.getElementById("qr-code").innerHTML = ""
      new QRCode(document.getElementById("qr-code"), {
        text: `${ip}:${port}`,
        width: 128,
        height: 128,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
      });
      document.getElementById('online-shower').style.display = "block"
    } else {
      document.getElementById('status-text').innerText = "OFFLINE"
      document.getElementById('status-dot-1').style.color = "#bbb"
      document.getElementById('status-dot-2').style.color = "#bbb"
      document.getElementById('toggle-server-btn').innerText = "Start Server"
      document.getElementById('toggle-server-btn').classList.remove("btn-success")
      document.getElementById('toggle-server-btn').classList.add("btn-dark")
      document.getElementById('online-shower').style.display = "none"
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
    } else {
      var elements = document.getElementsByClassName('all-sections')
      for(var i=0; i<elements.length; i++) { 
        elements[i].style.display='none'
      }
      document.getElementById(event).style.display = 'block'
      ipcRenderer.send("user:listUpdate")
    }
  })

  let imageb64

  function readImg(e) {
    if (this.files && this.files[0]) {
      var FR= new FileReader();

      FR.addEventListener("load", (e) => {
        imageb64 = e.target.result;
      });

      FR.readAsDataURL(this.files[0]);
    }
  }

  document.getElementById("picture-add").addEventListener("change", readImg);

  document.getElementById('add-btn-submit').addEventListener('click', () => {
    var uname = document.getElementById('username-add').value
    var rname = document.getElementById('realname-add').value
    var pword = document.getElementById('password-add').value
    if (uname && rname && pword && imageb64) {
      var new_user = {
        real_name: rname, 
        user_name: uname, 
        plaintext_password: pword, 
        picture_base64: imageb64
      }
      ipcRenderer.send("user:add", new_user)
      document.getElementById('username-add').value = ""
      document.getElementById('realname-add').value = ""
      document.getElementById('password-add').value = ""
      document.getElementById("picture-add").value = document.getElementById("picture-add").defaultValue
      imageb64 = null
    }
  })

  function pop_toast(msg, bg) { 
    document.getElementById('toast').innerText = msg
    document.getElementById('toast').style.display = "block"
    document.getElementById('toast').classList.add("show-toast")

    var x = document.getElementById('toast').classList
    for (var i=0; i<x.length; i++) {
      if (x[i].match(/bg-/g) !== null) {
        x.remove(x[i])
      }
    }

    document.getElementById('toast').classList.add(bg)
    setTimeout(()=>{
      document.getElementById('toast').classList.remove("show-toast")
      document.getElementById('toast').style.display = "none"
      document.getElementById('toast').innerText = ""
    } , 3000)
  }

  ipcRenderer.on("toast-trig", (_, msg, bg) => {
    pop_toast(msg, `bg-${bg}`)
  })

  ipcRenderer.on("notif-trig", (_, msg) => {
    document.getElementById('notifs').innerText = msg
  })

  document.getElementById("username-choose-uperms").addEventListener("change", ()=>{
    var e = document.getElementById("username-choose-uperms")
    let strSelected = e.options[e.selectedIndex].text
    
    if (strSelected !== "Select One" || e.selectedIndex !== 0) {
      ipcRenderer.send("displayPerms:user", strSelected)
    }

  })

  function updateuserlist(id, rows) {
    var u1 = document.getElementById(id)
    u1.innerHTML = ""
    var opt = document.createElement("option")
    opt.selected = false
    opt.disabled = false
    opt.innerText = "Select One"
    u1.appendChild(opt)

    for (var i=0; i<rows.length; i++) {
      var opt = document.createElement("option")
      opt.innerText = rows[i].user_name
      u1.appendChild(opt)
    }
  }

  ipcRenderer.on("listupdate:user", (_, rows) => {
    updateuserlist("username-choose-uperms", rows)
    updateuserlist("username-choose-editpw", rows)
  })

  var unallFolders = []

  ipcRenderer.on("user:displayPerms", (_, rows, uname) => {
    unallFolders = []
    data = rows[0]
    document.getElementById("uname-chosen-pms").innerText = uname
    if (data.can_download === 1) {
      document.getElementById("down-yes-pms").click()
    } else {
      document.getElementById("down-no-pms").click()
    }
    if (data.can_rename === 1) {
      document.getElementById("rnm-yes-pms").click()
    } else {
      document.getElementById("rnm-no-pms").click()
    }
    if (data.can_delete === 1) {
      document.getElementById("del-yes-pms").click()
    } else {
      document.getElementById("del-no-pms").click()
    }

    unallFolders = JSON.parse(data.folders_unallowed)

    updateUnallowedDirs()

    document.getElementById("username-perms-show-container").style.display = "block"

  })

  function updateUnallowedDirs() { 
    deleteUnallowedDirs()

    for (var i=0; i<unallFolders.length; i++) {
      addUnallowedDirectory(unallFolders[i])
    }

  }

  function addUnallowedDirectory(dirname) {

    let d1 = document.createElement("div")
    d1.classList.add("col-sm-10")
    d1.classList.add("text-break")
    d1.innerText = dirname

    let d2 = document.createElement("div")
    d2.classList.add("col-sm-2")
    d2.classList.add("close-icon")
    d2.classList.add("text-center")
    d2.innerText = "✖"
    d2.addEventListener("click", ()=> {

      var index = unallFolders.indexOf(dirname)
      if (index > -1) {
        unallFolders.splice(index, 1)
      }

      updateUnallowedDirs()
    })

    let d3 = document.createElement("div")
    d3.classList.add("row")
    d3.appendChild(d1)
    d3.appendChild(d2)

    let d4 = document.createElement("div")
    d4.classList.add("col-sm-12")
    d4.classList.add("border")
    d4.classList.add("rounded")
    d4.appendChild(d3)

    let d5 = document.createElement("div")
    d5.classList.add("row")
    d5.classList.add("mt-1")
    d5.appendChild(d4)

    let d6 = document.getElementById("add-dir-cont")
    d6.parentNode.insertBefore(d5, d6)
  }

  function deleteUnallowedDirs() {
    document.getElementById("add-dir-cont").parentNode.innerHTML = `
    <div class="row mb-2">
        <div class="col-sm-12"> <u> Unallowed Directories </u> </div>
    </div>
    <div class="row mt-3" id="add-dir-cont">
        <div class="col-sm-12">
            <button class="btn btn-success" id="dir-selector">Add Directory</button>
        </div>
    </div>`

    document.getElementById("dir-selector").addEventListener("click", ()=> {
      ipcRenderer.send("open:folder")
    })

  }

  document.getElementById("dir-selector").addEventListener("click", ()=> {
    ipcRenderer.send("open:folder")
  })

  ipcRenderer.on("folder:open", (_, path) => {
    if (unallFolders.indexOf(path[0]) == -1) {
      unallFolders.push(path[0])
      updateUnallowedDirs()
    } else {
      pop_toast("Directory already exists", "bg-warning")
    }   
    }
  )

  document.getElementById("update-perms-final-btn").addEventListener("click", ()=>{
    let data = {}

    let d = document.getElementsByName("down-pms")
    for (var i=0; i<d.length; i++) {
      if (d[i].checked) {
        data.can_download = (d[i].value === "Yes") ? 1 : 0
      }
    }
    
    d = document.getElementsByName("rnm-pms")
    for (var i=0; i<d.length; i++) {
      if (d[i].checked) {
        data.can_rename = (d[i].value === "Yes") ? 1 : 0
      }
    }

    d = document.getElementsByName("del-pms")
    for (var i=0; i<d.length; i++) {
      if (d[i].checked) {
        data.can_delete = (d[i].value === "Yes") ? 1 : 0
      }
    }

    data.folders_unallowed = JSON.stringify(unallFolders)

    data.user_name = document.getElementById("uname-chosen-pms").innerText
    
    ipcRenderer.send("perms:updated", data)
  })

  document.getElementById("username-choose-editpw").addEventListener("change", ()=>{
    
    document.getElementById("edit-pw-of").style.display = "block"
    document.getElementById("edited-pw-btn").addEventListener("click", ()=> {
      var e = document.getElementById("username-choose-editpw")
      let uname = e.options[e.selectedIndex].text

      let ps = document.getElementById("edited-pw").value

      if (ps) {
        ipcRenderer.send("user:changepw", uname, ps)
      }
    })
  })
})
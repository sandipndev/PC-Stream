var cwd = '/'
var icosavailable = ["avi", "css", "csv", "doc", "exe", "html", "iso", "jpg", "js", "json", "mkv", "mp3", "mp4", "pdf", "png", "ppt", "psd", "py", "rtf", "svg", "torrent", "txt", "wmv", "xml", "zip"]

$(document).ready(() => {

    window.vueapp = new Vue({
        el: '#app',
        data: {
            files : [],
            folders: [],
            unknowns: [],
            disks: [],
            getDir: getDir,
            gtDr: getDirExtended
        }, computed: {
            fileExts() {
                var res = []
                for (var i=0; i<this.files.length; i++) {
                    var x = this.files[i]
                    var ext = x.slice(x.lastIndexOf('.')+1)
                    if (ext === "jpeg") {
                        ext = "jpg"
                    }
                    if (icosavailable.includes(ext)) {
                        res.push(ext)
                    }
                    else {
                        res.push("others")
                    }
                }
                return res
            }, cwd() {
                return cwd
            }
        }
    })

    getDir(cwd)

})

function resetDisp() {
    vueapp.disks = []
    vueapp.files = []
    vueapp.folders = []
    vueapp.unknowns = []
}

function updateShowDir(dir) {
    $("#show-dir").html("")

    var rx = []
    if (dir === '/') rx = ['Drives/Root']
    else rx = dir.split('/').filter((x)=>x!=="")
    
    for (var i=0; i<rx.length; i++) {
        var d = document.createElement("kbd")
        d.classList.add("mr-2")
        d.innerText = rx[i]
        var dest = rx.slice(0, i+1).join('/') + '/'
        d.setAttribute("onclick", `getDir("${dest}")`)

        $("#show-dir").append(d)
    }
}

function refreshDir() {
    getDir(cwd);
}

function getDirExtended(d) {
    if (cwd[cwd.length-1] === '/')
        getDir(cwd +d)
    else
        getDir(cwd + '/' +d)
}

function getDir(dir) {
    if (dir === 'Drives/Root')
        dir = '/'

    $("#loadin").show()

    $.ajax({
        type: "POST",
        url: "../getdir",
        data: {
            session_key: sessKey,
            dir: dir
        },
        dataType: "json",
        success: (response) => {

            $("#loadin").hide()

            resetDisp()

            if (response["disks"]) {
                vueapp.disks = response["disks"]
            }
            if (response["unknowns"]) {
                vueapp.unknowns = response["unknowns"]
            }
            if (response["files"]) {
                vueapp.files = response["files"]
            }
            if (response["folders"]) {
                vueapp.folders = response["folders"]
            }

            if (dir !== '/') {
                if (cwd !== '/') {
                    cwd = dir
                }
                else {
                    cwd = dir
                }
            } else {
                cwd = dir
            }

            updateShowDir(cwd)

            vueapp.$forceUpdate()
        }
    })
}
var cwd = '/'
var icosavailable = ["avi", "css", "csv", "doc", "exe", "html", "iso", "jpg", "js", "json", "mkv", "mp3", "mp4", "pdf", "png", "ppt", "psd", "py", "rtf", "svg", "torrent", "txt", "wmv", "xml", "zip"]
var os = null

$(document).ready(() => {

    $.ajax({
        type: "GET",
        url: "../servercheck",
        success: (response) => {
            os = response.slice(response.lastIndexOf(", ")+2)
        }
    })

    $.ajax({
        type: "POST",
        url: "../getPicture",
        data: {
            session_key: sessKey
        },
        dataType: "json",
        success: (response) => {
            $("#fname").text(response["name"])
            $("#profile-dp").attr("src", response["base64DP"])
        }
    })

    window.vueapp = new Vue({
        el: '#app',
        data: {
            files : [],
            folders: [],
            unknowns: [],
            disks: [],
            getDir: getDir,
            gtDr: getDirExtended,
            gtFile: getFile
        }, computed: {
            fileExts() {
                var res = []
                for (var i=0; i<this.files.length; i++) {
                    var x = this.files[i]
                    var ext = x.slice(x.lastIndexOf('.')+1).toLowerCase()
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

    $("#profile-dp").on("click", ()=>{
        $("#name-logout-dialog").show()
    })

    $("#closer-name-logout-dialog").on("click", ()=>{
        $("#name-logout-dialog").hide()
    })

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
        
        if (os === 'win32')
            d.setAttribute("onclick", `getDir("${dest}")`)
        else
            d.setAttribute("onclick", `getDir("/${dest}")`)

        $("#show-dir").append(d)
    }

    $("#browse-chunks").stop().animate({
        scrollLeft: $("#browse-chunks")[0].scrollWidth
    }, 500)
}

function refreshDir() {
    getDir(cwd);
}

function getDirExtended(d) {
    if (cwd[cwd.length-1] === '/' && os === 'win32')
        getDir(cwd +d)
    else if (os === 'win32')
        getDir(cwd + '/' +d)
    else
        getDir(cwd + d + '/')
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

function getFile(filename) {
    $("#loadin").show()

    if (os === 'win32')
        var fullFileDir = cwd + '/' + filename
    else
        var fullFileDir = cwd + filename
    
    $.ajax({
        type: "POST",
        url: "../getFileInfo",
        data: {
            session_key: sessKey,
            file: fullFileDir
        },
        dataType: "json",
        success: (r) => {
            $("#loadin").hide()

            alert(JSON.stringify(r))
            
        }
    })
}
$(document).ready(() => {

    window.vueapp = new Vue({
        el: '#app',
        data : {
            files : [],
            folders: [],
            unknowns: [],
            disks: []
        }
    })

})

function resetDisp() {
    vueapp.disks = []
    vueapp.files = []
    vueapp.folders = []
    vueapp.unknowns = []
}

function getDir(dir) {
    $.ajax({
        type: "POST",
        url: "../getdir",
        data: {
            session_key: sessKey,
            dir: dir
        },
        dataType: "json",
        success: (response) => {

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
        }
    })
}
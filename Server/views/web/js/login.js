function login() {
    var unm = $("#username").val();
    var pwd = $("#password").val();

    $.ajax({
        type: "POST",
        url: "../authenticate",
        data: {
            username: unm,
            password: pwd
        },
        dataType: "json",
        error: function (xhr) {
            $('#username').removeClass("is-invalid")
            $('#username').removeClass("is-valid")
            $('#password').removeClass("is-invalid")
            $('#password').removeClass("is-valid")

            if (xhr.responseText === "UNAME_X") {
                $('#username').addClass("is-invalid")
            } else if (xhr.responseText === "PWORD_X") {
                $('#username').addClass("is-valid")
                $('#password').addClass("is-invalid")
            }
        },
        success: function (response) {
            $('#username').removeClass("is-invalid")
            $('#password').removeClass("is-invalid")
            $('#username').addClass("is-valid")
            $('#password').addClass("is-valid")

            window.location.href = `../weblogin?sessKey=${response.sessKey}`
        }
    });
}
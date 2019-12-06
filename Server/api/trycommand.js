const { sh } = require("../misc/randomfuncs")

sh("dir C:\\Users\\Sandi")
.then(({stdout, stderr}) => {
    console.log(stdout, stderr)
})
.catch((err) => {
    console.log(err)
})
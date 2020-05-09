const fs = require("fs")

let path1 = "./test.txt"
let path2 = "./test2.txt"

fs.writeFileSync(path1, "Hello")
let str1 = fs.readFileSync(path1, "utf-8")

fs.writeFile(path2, "World", () => {
    let str2 = fs.readFileSync(path2, "utf-8")
    console.log("Inspect:" + __fromJSGetTrackingIndex(str1 + str2))
    __fromJSWaitForSendLogsAndExitNodeProcess()
})

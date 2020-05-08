const fs = require("fs")
const str = "Hello"

let path = "./test.txt"

fs.writeFileSync(path, str)

let str2 = fs.readFileSync(path, "utf-8")
console.log({ str2 })
console.log("Inspect:" + __fromJSGetTrackingIndex(str2))
__fromJSWaitForSendLogsAndExitNodeProcess()
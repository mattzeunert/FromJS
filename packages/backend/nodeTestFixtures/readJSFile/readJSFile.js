
console.log("IN FILE")
const fs = require("fs")
const file = fs.readFileSync(__dirname + "/test.js", "utf-8")
console.log("Inspect:" + __fromJSGetTrackingIndex(file))
setTimeout(() => {
    process.exit()
}, 2000)
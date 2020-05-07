const data = require(__dirname + "/data.json")
console.log(data)
let value = data.a
console.log("Inspect:" + __fromJSGetTrackingIndex(value))
setTimeout(() => {
    process.exit()
}, 2000)
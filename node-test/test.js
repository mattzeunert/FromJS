
const prettyBytes = require("pretty-bytes")

let bytes = 400000
let msg = "Size: " + prettyBytes(bytes)
console.log(msg)

setTimeout(() => {
    console.log("waited 10s")
}, 10000)
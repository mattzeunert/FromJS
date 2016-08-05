var fs = require("fs");
var from = fs.readFileSync("./chrome-extension/dist/from.js")
var text = "module.exports = \"" + encodeURI(from) + "\""

var currentFile = fs.readFileSync("./chrome-extension/dist/fromjs-string.js")
console.log(currentFile.length, text.length)
if (currentFile.toString() !== text) {
    fs.writeFileSync("./chrome-extension/dist/fromjs-string.js", text)
}

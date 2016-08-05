var fs = require("fs");
var from = fs.readFileSync("./chrome-extension/dist/from.js")
var text = "module.exports = \"" + encodeURI(from) + "\""
fs.writeFileSync("./chrome-extension/dist/fromjs-string.js", text)

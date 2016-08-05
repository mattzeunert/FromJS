var sourceMapRegex = /\/\/#[\W]*sourceMappingURL=.*$/
function removeSourceMapIfAny(code){
    if (sourceMapRegex.test(code)){
        var sourceMapComment = code.match(/\/\/#[\W]*sourceMappingURL=.*$/)[0]
        code = code.replace(sourceMapComment, "")
    }
    return code
}

var fs = require("fs");
var from = fs.readFileSync("./chrome-extension/dist/from.js").toString()
from = removeSourceMapIfAny(from)
from += "\n//# sourceURL=chrome-extension-from-string/from.js"
console.log(from.substring(from.length - 20))
var text = "module.exports = \"" + encodeURI(from) + "\""


var currentFile = fs.readFileSync("./chrome-extension/dist/fromjs-string.js")
console.log(currentFile.length, text.length)
if (currentFile.toString() !== text) {
    fs.writeFileSync("./chrome-extension/dist/fromjs-string.js", text)
}

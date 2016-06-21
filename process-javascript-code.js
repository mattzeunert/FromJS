var babel = require("babel-core")
var Plugin = require("./plugin")
var babylon = require("babylon")
var btoa = require("btoa")

module.exports = function processJavaScriptCode(code, options){
    const ast = babylon.parse(code, {
        strict: false,
        allowReturnOutsideFunction: true,
        sourceFilename: options !== undefined ? options.filename : undefined
    });

    var res = babel.transformFromAst(ast, code, {
        sourceMap: true,
        plugins: [
            Plugin,
        ]
    });

    res.getMappingComment = function(){
        var comment = ""
        if (options && options.filename){
            comment += "\n//# sourceURL=" + options.filename
        }
        res.map.sourcesContent = [code]
        comment +=  "\n//# sourceMappingURL=data:application/json;base64," + btoa(JSON.stringify(res.map))
        return comment;
    }

    return res
}

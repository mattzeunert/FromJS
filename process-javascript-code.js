var babel = require("babel-core")
var Plugin = require("./plugin")
var babylon = require("babylon")
var btoa = require("btoa")

module.exports = function processJavaScriptCode(code){
    const ast = babylon.parse(code, {
        strict: false,
        allowReturnOutsideFunction: true
    });
    var res = babel.transformFromAst(ast, code, {
        sourceMap: true,
        plugins: [
            Plugin,
        ]
    });

    res.getMappingComment = function(){
        return "\n//# sourceMappingURL=data:application/json;base64," + btoa(JSON.stringify(res.map))
    }

    return res
}

var babel = require("babel-core")
var Plugin = require("./plugin")
var babylon = require("babylon")

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

    return res
}

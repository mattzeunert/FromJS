if (!process.env.isDemo) {
    // Data is pre-processed, so we don't need to include babel in the build
    var babel = require("babel-core")
    var Plugin = require("./plugin")
    var babylon = require("babylon")
}

module.exports = function processJavaScriptCode(code, options){
    const ast = babylon.parse(code, {
        strict: false,
        allowReturnOutsideFunction: true,
        sourceFilename: options !== undefined ? options.filename +"?dontprocess=yes" : undefined
    });

    var res = babel.transformFromAst(ast, code, {
        sourceMap: true,
        plugins: [
            Plugin,
        ]
    });

    return res
}

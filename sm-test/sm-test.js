var babel = require("babel-core")
var Plugin = require("babel-plugin-transform-es2015-arrow-functions")
var babylon = require("babylon")

var sourceMapRegex = /\/\/#[\W]*sourceMappingURL=.*$/
function removeSourceMapIfAny(code){
    // In theory we might be able to use this source map, but right now
    // 1) parsing source maps on the frontend is hard, because FE JS doesn't
    //    natively support parsing UTF-8 base64 which is used for inline source maps
    // 2) It could break things if we don't take it out, so need to do some work
    //    to handle the existing source map properly
    if (sourceMapRegex.test(code)){
        var sourceMapComment = code.match(/\/\/#[\W]*sourceMappingURL=.*$/)[0]
        code = code.replace(sourceMapComment, "")
    }
    return code
}

function processJavaScriptCode(code, options){
    code = removeSourceMapIfAny(code)

    const ast = babylon.parse(code, {
        strict: false,
        allowReturnOutsideFunction: true,
        sourceFilename: options !== undefined ? options.filename + ".dontprocess" : undefined
    });

    var res = babel.transformFromAst(ast, code, {
        sourceMaps: true,
        compact: false,
        plugins: [
            Plugin,
        ]
    });
    res.map.sourcesContent = undefined

    return res
}

window.processJavaScriptCode = processJavaScriptCode

var babel = require("babel-core")
var babylon = require("babylon")

// This code is required to simulate the fake page load in the Chrome extension
// Might reuse it later if moving the fake load / Babel processing to a separate module
var sharedPlugin = function(babel) {
    return {
        visitor: {
            MemberExpression(path){
                var ancestor = path.parentPath;
                while (ancestor.node.type === "MemberExpression") {
                    ancestor = ancestor.parentPath;
                }
                var ancestorIsAssignmentExpression = ancestor.node.type === "AssignmentExpression"

                // We can't overwrite document.readyState in the brower, so instead
                // try to intercept lookups for `readyState` properties
                // This won't catch document["ready" + "state"], but it's good enough
                if (!ancestorIsAssignmentExpression && (path.node.property.value === "readyState" || path.node.property.name === "readyState")) {
                    var call = babel.types.callExpression(
                        babel.types.identifier("f__getReadyState"),
                        [path.node.object]
                    )
                    path.replaceWith(call)
                }
            }
        }
    }
}

var sourceMapRegex = /\/\/#[\W]*sourceMappingURL=.*$/
export function removeSourceMapIfAny(code){
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

export default function(babelPlugin){


    return function processJavaScriptCode(code, options){
        code = removeSourceMapIfAny(code)

        const ast = babylon.parse(code, {
            strict: false,
            allowReturnOutsideFunction: true,
            sourceFilename: options !== undefined ? options.filename + ".dontprocess" : undefined
        });

        babelPlugin.sourceCode = code;

        var res = babel.transformFromAst(ast, code, {
            sourceMaps: true,
            compact: false,
            plugins: [
                sharedPlugin,
                babelPlugin
            ]
        });
        res.map.sourcesContent = undefined

        delete babelPlugin.sourceCode

        return res
    }
}

var template = require("babel-template");
var generate = require("babel-generator").default;
module.exports = function(babel) {
  return {
    visitor: {
      AssignmentExpression(path){
        if (!path.node.left.property || path.node.left.property.name !== "innerHTML") {
            return
        }
        path.replaceWith(babel.types.callExpression(
            babel.types.identifier("stringTraceSetInnerHTML"),
            [path.node.left.object, path.node.right]
        ))
      },
      BinaryExpression(path){
        if (path.node.operator === "+") {
            var call = babel.types.callExpression(
                babel.types.identifier("stringTraceAdd"),
                [path.node.left, path.node.right]
            )

            path.replaceWith(call)
        } else if (path.node.operator === "!==") {
            var call = babel.types.callExpression(
                babel.types.identifier("stringTraceNotTripleEqual"),
                [path.node.left, path.node.right]
            )

            path.replaceWith(call)
        }
      },
      StringLiteral(path) {
        // console.log(path.node.type)
        if (path.node.ignore) {
            return;
        }

        if (path.parent.type ==="ObjectProperty") {
            // object key like {"a": 88}
            return;
        }

        const buildRequire = template(`
          stringTrace(STRING)
        `);

        var str = babel.types.stringLiteral(path.node.value)
        str.ignore = true

        const ast = buildRequire({
            STRING: str
        });

        // console.log(generate(ast).code);

        // prop = babel.types.objectProperty(
        //     babel.types.identifier("hello"),
        //     babel.types.identifier("world")
        // )
        // path.replaceWith(babel.types.objectExpression([prop]))

        path.replaceWith(ast)

        // path.replaceWith(
        //     babel.types.binaryExpression("**", path.node.left, babel.types.numericLiteral(2))
        // );

        // path.node.left = babel.types.identifier("sebmck");
      }
    }
  };
}

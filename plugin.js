var template = require("babel-template");
var babylon = require("babylon")
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
      UnaryExpression(path){
          if (path.node.operator !== "typeof") {
              return
          }

          debugger

          if (path.node.ignore){return}
          var typeofExpression = babel.types.unaryExpression("typeof", path.node.argument);
          typeofExpression.ignore=true;

          var undefinedLiteral = babel.types.stringLiteral("undefined");
          undefinedLiteral.ignore = true;

          var binaryExpression =  babel.types.binaryExpression("===", typeofExpression, undefinedLiteral);
          binaryExpression.ignore = true

          var replacement = babel.types.conditionalExpression(
                  binaryExpression,
                  undefinedLiteral,
                  babel.types.callExpression(babel.types.identifier("stringTraceTypeOf"),[path.node.argument])
            )


          path.replaceWith(replacement)
      },
      BinaryExpression(path){
          if (path.node.ignore){return}
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
        } else if (path.node.operator === "===") {
            var call = babel.types.callExpression(
                babel.types.identifier("stringTraceTripleEqual"),
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

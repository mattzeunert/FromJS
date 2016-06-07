var template = require("babel-template");
var babylon = require("babylon")
var generate = require("babel-generator").default;

module.exports = function(babel) {


  return {
    visitor: {
      AssignmentExpression(path){
          if (path.node.ignore){return}
        if (path.node.left.property && path.node.left.property.name === "innerHTML") {
            path.replaceWith(babel.types.callExpression(
                babel.types.identifier("stringTraceSetInnerHTML"),
                [path.node.left.object, path.node.right]
            ))
        }
        if (path.node.operator === "+=") {
            var assignmentExpression = babel.types.assignmentExpression(
                "=",
                path.node.left,
                babel.types.callExpression(
                    babel.types.identifier("stringTraceAdd"),
                    [path.node.left,path.node.right]
                )
            )
            assignmentExpression.ignore = true

            path.replaceWith(assignmentExpression)
        }

      },
      UnaryExpression(path){
          if (path.node.operator !== "typeof") {
              return
          }

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
        replacement.ignore = true;


          path.replaceWith(replacement)
      },
      ConditionalExpression(path){
          if (path.node.ignore){return}

          var callExpression = babel.types.callExpression(babel.types.identifier("stringTraceUseValue"),[
              path.node.test
          ])
          callExpression.ignore = true;

          var conditionalExpression = babel.types.conditionalExpression(
              callExpression,
              path.node.consequent,
              path.node.alternate
          )
          conditionalExpression.ignore = true;

          path.replaceWith(conditionalExpression)
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
      SwitchStatement(path){
          if (path.node.ignore){return}
          var switchStatement = babel.types.switchStatement(
              babel.types.callExpression(babel.types.identifier("stringTraceUseValue"), [
                  path.node.discriminant
              ]),
              path.node.cases
          );

          switchStatement.ignore = true
          path.replaceWith(switchStatement)
      },
      WhileStatement(path){
          if (path.node.ignore){return}
          var whileStatement = babel.types.whileStatement(
              babel.types.callExpression(babel.types.identifier("stringTraceUseValue"), [
                  path.node.test
              ]),
              path.node.body
          )
          whileStatement.ignore = true;

          path.replaceWith(whileStatement)
      },
      StringLiteral(path) {
        // console.log(path.node.type)
        if (path.node.ignore) {
            return;
        }

        if(path.parent.type === "SwitchCase") {
            // e.g. case "hi": ....
            return
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

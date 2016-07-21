var template = require("babel-template");
// var babylon = require("babylon")
// var generate = require("babel-generator").default;

module.exports = function(babel) {
  return {
    visitor: {
      AssignmentExpression(path){
          if (path.node.ignore){return}
        if (path.node.left.property && path.node.left.property.name === "innerHTML") {
            path.replaceWith(babel.types.callExpression(
                babel.types.identifier("t__setInnerHTML"),
                [path.node.left.object, path.node.right]
            ))
        }
        if (path.node.operator === "+=") {
            var assignmentExpression = babel.types.assignmentExpression(
                "=",
                path.node.left,
                babel.types.callExpression(
                    babel.types.identifier("f__add"),
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
                  babel.types.callExpression(babel.types.identifier("f__typeof"),[path.node.argument])
            )
        replacement.ignore = true;


          path.replaceWith(replacement)
      },
      ConditionalExpression(path){
          if (path.node.ignore){return}

          var callExpression = babel.types.callExpression(babel.types.identifier("f__useValue"),[
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
      IfStatement(path){
          path.node.test = babel.types.callExpression(
              babel.types.Identifier("f__useValue"),
              [path.node.test]
          )
      },
      BinaryExpression(path){
          if (path.node.ignore){return}
        if (path.node.operator === "+") {
            var call = babel.types.callExpression(
                babel.types.identifier("f__add"),
                [path.node.left, path.node.right]
            )

            path.replaceWith(call)
        } else if (path.node.operator === "!==") {
            var call = babel.types.callExpression(
                babel.types.identifier("f__notTripleEqual"),
                [path.node.left, path.node.right]
            )

            path.replaceWith(call)
        } else if (path.node.operator === "===") {
            var call = babel.types.callExpression(
                babel.types.identifier("f__tripleEqual"),
                [path.node.left, path.node.right]
            )

            path.replaceWith(call)
        }
      },
      LogicalExpression(path){
          if(path.node.operator === "||"){
              var call = babel.types.callExpression(
                  babel.types.identifier("f__or"),
                  [path.node.left, path.node.right]
              )
              path.replaceWith(call)
          }
          if(path.node.operator === "&&"){
              var call = babel.types.callExpression(
                  babel.types.identifier("f__and"),
                  [path.node.left, path.node.right]
              )
              path.replaceWith(call)
          }
      },
      SwitchStatement(path){
          if (path.node.ignore){return}
          var switchStatement = babel.types.switchStatement(
              babel.types.callExpression(babel.types.identifier("f__useValue"), [
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
              babel.types.callExpression(babel.types.identifier("f__useValue"), [
                  path.node.test
              ]),
              path.node.body
          )
          whileStatement.ignore = true;

          path.replaceWith(whileStatement)
      },
      UnaryExpression(path){
          if (path.node.operator === "!"){
              path.replaceWith(babel.types.callExpression(
                  babel.types.identifier("f__not"),
                  [path.node.argument]
              ))
          }
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

        if (path.parent.type ==="ObjectProperty" && path.node.start === path.parent.key.start) {
            // object key like {"a": 88}
            // but should work for sth like {"a": "kkkk"} (value should be parsed)

            return;
        }

        const buildRequire = template(`
          f__StringLiteral(STRING)
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
        ast.expression.loc = path.node.loc
        // debugger
        path.replaceWith(ast)

        // path.replaceWith(
        //     babel.types.binaryExpression("**", path.node.left, babel.types.numericLiteral(2))
        // );

        // path.node.left = babel.types.identifier("sebmck");
      }
    }
  };
}

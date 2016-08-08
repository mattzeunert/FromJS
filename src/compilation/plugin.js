var template = require("babel-template");
var _ = require("underscore")
// var babylon = require("babylon")
// var generate = require("babel-generator").default;

module.exports = function(babel) {
  return {
    visitor: {
      AssignmentExpression(path){
          if (path.node.ignore){return}
        if (path.node.left.property && path.node.left.property.name === "innerHTML" ) {
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
        if (path.node.operator === "=" && path.node.left.type === "MemberExpression" &&
        path.node.left.computed === true) {
            path.replaceWith(babel.types.callExpression(
                babel.types.identifier("f__assign"),
                [
                    path.node.left.object,
                    path.node.left.property,
                    path.node.right
                ]
            ))
        }

      },
      ForInStatement(path){
          if (path.node.ignore)return

          var oldLeft = path.node.left
          var newVarName = "__fromJSForIn" + _.uniqueId()

          var untrackedProperty;
          var originalVariableDeclaration
          if (path.node.left.type === "VariableDeclaration") {
              if (path.node.left.declarations.length === 1) {
                  untrackedProperty = babel.types.identifier(path.node.left.declarations[0].id.name)
                  originalVariableDeclaration = oldLeft
                  originalVariableDeclaration.declarations[0].init = undefined
              }
              else {
                  console.log("aaa",path.node.left.declarations)
                  throw "no"
              }
          } else if (path.node.left.type === "Identifier"){
                untrackedProperty = babel.types.identifier(path.node.left.name)
          } else {
              console.log("bb", path.node.left.type)
              throw "no"
          }

          path.node.left = babel.types.variableDeclaration(
              "var",
              [babel.types.variableDeclarator(
                  babel.types.identifier(newVarName)
              )]
          )


          path.traverse({
              ExpressionStatement(path){
                // replace `for (i in k) sth` with `for (i in k) {sth}`
                  if (path.parent.type !== "ForInStatement"){
                      return
                  }
                  path.replaceWith(babel.types.blockStatement(
                      [
                          path.node
                      ]
                  ))
              },
              IfStatement(path){
                // replace `for (i in k) if () sth` with `for (i in k) {if () sth}`
                  if (path.parent.type !== "ForInStatement"){
                      return
                  }
                  path.replaceWith(babel.types.blockStatement(
                      [
                          path.node
                      ]
                  ))
              },
              ReturnStatement(path){

                  if (path.parent.type !== "ForInStatement"){
                      return
                  }
                  path.replaceWith(babel.types.blockStatement(
                      [
                          path.node
                      ]
                  ))
              }
              // are there other statement types I need to handle???
          })

          path.traverse({
              BlockStatement: function(blockStatementPath){
                  blockStatementPath.node.body.unshift(
                      babel.types.expressionStatement(
                          babel.types.assignmentExpression(
                              "=",
                              untrackedProperty,
                              babel.types.callExpression(
                                  babel.types.identifier("f__getTrackedPropertyName"),
                                  [
                                      path.node.right,
                                      babel.types.identifier(newVarName)
                                  ]
                              )
                          )
                      )
                  )
                  if (originalVariableDeclaration) {
                      blockStatementPath.node.body.unshift(originalVariableDeclaration)
                  }
              }
         })
      },
      UnaryExpression(path){

          if (path.node.operator === "!"){
              path.replaceWith(babel.types.callExpression(
                  babel.types.identifier("f__not"),
                  [path.node.argument]
              ))
          }

          if (path.node.operator === "typeof") {
              if (path.node.ignore){return}
              // We can't pass a variable that doesn't exist in the scope into a function (ReferenceError)
              // so check that the variable is defined first.
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
        }





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
      ObjectExpression(path){
          path.node.properties.forEach(function(prop){
              if (prop.key.type === "Identifier") {
                  var keyLoc = prop.key.loc
                  prop.key = babel.types.stringLiteral(prop.key.name)
                  prop.key.loc = keyLoc
                  // move start a bit to left to compensate for there not
                  // being quotes in the original "string", since
                  // it's just an identifier
                  if (prop.key.loc.start.column > 0) {
                      prop.key.loc.start.column--;
                  }
              }
          })

          var call = babel.types.callExpression(
              babel.types.identifier("f__makeObject"),
              [babel.types.arrayExpression(
                   path.node.properties.map(function(prop){
                       var propArray = babel.types.arrayExpression([
                           prop.key,
                           prop.value
                       ])
                       return propArray
                   })
               )
            ]
          )
          path.replaceWith(call)
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
              var call = babel.types.conditionalExpression(
                  babel.types.sequenceExpression([
                      babel.types.callExpression(
                          babel.types.identifier("f__setCachedValue"),
                          [path.node.left]
                      ),
                      babel.types.callExpression(
                          babel.types.identifier("f__useValue"),
                          [babel.types.callExpression(
                              babel.types.identifier("f__getCachedValue"),
                              []
                          )]
                      )
                  ]),
                  babel.types.callExpression(
                      babel.types.identifier("f__getCachedValue"),
                      []
                  ),
                  path.node.right
              )
              path.replaceWith(call)
          }
          if(path.node.operator === "&&"){
              var call = babel.types.conditionalExpression(
                  babel.types.sequenceExpression([
                      babel.types.callExpression(
                          babel.types.identifier("f__setCachedValue"),
                          [path.node.left]
                      ),
                      babel.types.callExpression(
                          babel.types.identifier("f__useValue"),
                          [babel.types.callExpression(
                              babel.types.identifier("f__getCachedValue"),
                              []
                          )]
                      )
                  ]),
                  path.node.right,
                  babel.types.callExpression(
                      babel.types.identifier("f__getCachedValue"),
                      []
                  )
              )
              path.replaceWith(call)
          }
      },
      SwitchStatement(path){
          if (path.node.ignore){return}

          var cases = path.node.cases;
          cases.forEach(function(ccase){
              if (ccase.test ===null){
                  return // e.g. default case
              }
              ccase.test = babel.types.callExpression(
                  babel.types.identifier("f__useValue"),
                  [ccase.test]
              )
          })
          var switchStatement = babel.types.switchStatement(
              babel.types.callExpression(babel.types.identifier("f__useValue"), [
                  path.node.discriminant
              ]),
              cases
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

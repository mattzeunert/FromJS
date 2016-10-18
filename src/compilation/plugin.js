var _ = require("underscore")

module.exports = function(babel) {
  return {
    visitor: {
      AssignmentExpression(path){
        if (path.node.ignore){return}

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

        if (path.node.operator === "=" && path.node.left.type === "MemberExpression") {
            var property;
            if (path.node.left.computed === true) {
                property = path.node.left.property
            } else {
                property = babel.types.stringLiteral(path.node.left.property.name)
                property.loc = path.node.left.property.loc
            }
            path.replaceWith(babel.types.callExpression(
                babel.types.identifier("f__assign"),
                [
                    path.node.left.object,
                    property,
                    path.node.right
                ]
            ))
        }
      },
      MemberExpression(path){
          // We can't overwrite document.readyState in the brower, so instead
          // try to intercept lookups for `readyState` properties
          // This won't catch document["ready" + "state"], but it's good enough
          if (path.node.property.value === "readyState" || path.node.property.name === "readyState") {
              var call = babel.types.callExpression(
                  babel.types.identifier("f__getReadyState"),
                  [path.node.object]
              )
              path.replaceWith(call)
          } else if (path.node.property.value === "toString" || path.node.property.name === "toString"){
              // toString calls on tracked objects return a native string, so call a special
              // function that returns the tracked string again
              // toString needs to return a stirng when called from native browser code

              // There might be different ways to do this that don't require modifying code
              // and that are more reliable
              // (e.g. I could capture a call stack and see if it was a call by a native function, but
              // my thinking right now is that I'd rather avoid the perf penality of getting a stack trace)
              var call = babel.types.callExpression(
                  babel.types.identifier("f__getToString"),
                  [path.node.object]
              )
              path.replaceWith(call)
          }
      },
      ForInStatement(path){
          if (path.node.ignore)return

          // for..in doesn't work correctly on traced objects,
          // so for traced objects we want to iterate over the untraced object
          var originalObject = path.node.right
          var newObject = babel.types.callExpression(
              babel.types.identifier("f__getForInLoopKeyObject"),
              [
                  originalObject
              ]
          )
          newObject.ignore = true;
          path.node.right = newObject;

          var oldLoopVariableDeclaration = path.node.left
          var newVarName = "__fromJSForIn" + _.uniqueId()

          var untrackedProperty;
          var originalVariableDeclaration
          if (path.node.left.type === "VariableDeclaration") {
              if (path.node.left.declarations.length === 1) {
                  untrackedProperty = babel.types.identifier(path.node.left.declarations[0].id.name)
                  originalVariableDeclaration = oldLoopVariableDeclaration
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
                                      originalObject,
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
      ForStatement(path){
          if (path.node.test) {
              path.node.test = babel.types.callExpression(
                  babel.types.identifier("f__useValue"),
                  [path.node.test]
              )
          }
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
          path.node.test = babel.types.callExpression(babel.types.identifier("f__useValue"),[
              path.node.test
          ])
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

          var replacements = {
              "+": "f__add",
              "-": "f__subtract",
              "/": "f__divide",
              "*": "f__multiply",
              "!==": "f__notTripleEqual",
              "===": "f__tripleEqual",
              "!=": "f__notDoubleEqual",
              "==": "f__doubleEqual"
          }

          var replacement = replacements[path.node.operator]
          if (replacement) {
              var call = babel.types.callExpression(
                  babel.types.identifier(replacement),
                  [path.node.left, path.node.right]
              )
              call.loc = path.node.loc

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

          path.node.discriminant = babel.types.callExpression(babel.types.identifier("f__useValue"), [
              path.node.discriminant
          ])
      },
      WhileStatement(path){
          path.node.test = babel.types.callExpression(babel.types.identifier("f__useValue"), [
              path.node.test
          ])
      },
      StringLiteral(path) {
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

        var str = babel.types.stringLiteral(path.node.value)
        str.ignore = true

        const call = babel.types.callExpression(
            babel.types.identifier("f__StringLiteral"),
            [str]
        )

        call.loc = path.node.loc
        path.replaceWith(call)
      }
    }
  };
}

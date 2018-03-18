import * as FunctionNames from "./FunctionNames";
import * as babel from "@babel/core";
import * as OperationTypes from "./OperationTypes";
// import * as fs from "fs";
import * as babylon from "babylon";

import helperCodeLoaded from "./helperFunctions";
import helperFunctions from "./helperFunctions";
let helperCode = helperCodeLoaded.replace(
  "__FUNCTION_NAMES__",
  JSON.stringify(FunctionNames)
);
helperCode = helperCode.replace(
  "__OPERATION_TYPES__",
  JSON.stringify(OperationTypes)
);
helperCode += "/* HELPER_FUNCTIONS_END */ ";

// I got some babel-generator "cannot read property 'type' of undefined" errors
// when prepending the code itself, so just prepend a single eval call expression
helperCode = "eval(`" + helperCode + "`)";
// console.log(helperCode);

export default function plugin(babel) {
  const { types: t } = babel;

  var ignoredStringLiteral = function(str) {
    var l = t.stringLiteral(str);
    l.ignore = true;
    return l;
  };

  function ignoredIdentifier(name) {
    var id = t.identifier(name);
    id.ignore = true;
    return id;
  }

  function ignoredCallExpression(identifier, args) {
    var call = t.callExpression(ignoredIdentifier(identifier), args);
    call.ignore = true;
    return call;
  }

  function ignoredNumericLiteral(number) {
    var n = t.numericLiteral(number);
    n.ignore = true;
    return n;
  }

  var getLastOp = ignoredCallExpression(
    FunctionNames.getLastOperationTrackingResult,
    []
  );

  var getLastOpValue = ignoredCallExpression(
    FunctionNames.getLastOperationValueResult,
    []
  );

  function isInWhileStatement(path) {
    return isInNodeType("WhileStatement", path);
  }

  function isInIfStatement(path) {
    return isInNodeType("IfStatement", path);
  }

  function isInForStatement(path) {
    return isInNodeType("ForStatement", path);
  }

  function isInAssignmentExpression(path) {
    return isInNodeType("AssignmentExpression", path);
  }

  function isInLeftPartOfAssignmentExpression(path) {
    return isInNodeType("AssignmentExpression", path, function(path, prevPath) {
      return path.node.left === prevPath.node;
    });
  }

  function isInCallExpressionCallee(path) {
    return isInNodeType("CallExpression", path, function(path, prevPath) {
      return path.node.callee === prevPath.node;
    });
  }

  function isInNodeType(type, path, extraCondition = null, prevPath = null) {
    if (prevPath === null) {
      isInNodeType(type, path.parentPath, extraCondition, path);
    }
    if (path.node.type === "Program") {
      return false;
    }
    if (path.node.type === type) {
      if (!extraCondition || extraCondition(path, prevPath)) {
        return true;
      }
    }
    if (path.parentPath) {
      return isInNodeType(type, path.parentPath, extraCondition, path);
    }
  }

  function createOperation(opType, opArgs) {
    var call = babel.types.callExpression(
      ignoredIdentifier(FunctionNames.doOperation),
      [ignoredStringLiteral(opType), ...opArgs]
    );

    call.ignore = true;
    return call;
  }

  function ignoreNode(node) {
    node.ignore = true;
    return node;
  }

  function runIfIdentifierExists(identifierName, thenNode) {
    const iN = ignoreNode;
    return iN(
      t.logicalExpression(
        "&&",
        iN(
          t.binaryExpression(
            "!==",
            iN(t.UnaryExpression("typeof", ignoredIdentifier(identifierName))),
            ignoredStringLiteral("undefined")
          )
        ),
        ignoredIdentifier(identifierName)
      )
    );
  }

  function trackingIdentifierIfExists(identifierName) {
    var trackingIdentifierName = identifierName + "_t";
    return runIfIdentifierExists(
      trackingIdentifierName,
      ignoredIdentifier(trackingIdentifierName)
    );
  }

  return {
    name: "babel-plugin-data-flow",
    visitor: {
      Program: {
        // Run on exit so injected code isn't processed by other babel plugins
        exit: function(path) {
          var initCodeAstNodes = babylon
            .parse(helperCode)
            .program.body.reverse();
          initCodeAstNodes.forEach(node => {
            path.node.body.unshift(node);
          });
        }
      },
      FunctionDeclaration(path) {
        path.node.params.forEach((param, i) => {
          var d = t.variableDeclaration("var", [
            t.variableDeclarator(
              ignoredIdentifier(param.name + "_t"),
              ignoredCallExpression(FunctionNames.getFunctionArgTrackingInfo, [
                ignoredNumericLiteral(i)
              ])
            )
          ]);
          d.ignore = true;
          path.node.body.body.unshift(d);
        });
      },
      StringLiteral(path) {
        if (path.parent.type === "ObjectProperty") {
          return;
        }
        if (path.node.ignore) {
          return;
        }
        path.node.ignore = true;
        const locId = t.stringLiteral(path.node.start + "-" + path.node.end);
        locId.ignore = true;
        var call = t.callExpression(
          ignoredIdentifier(FunctionNames.doOperation),
          [
            ignoredStringLiteral("stringLiteral"),
            t.arrayExpression([path.node, t.nullLiteral()])
          ]
        );
        call.ignore = true;
        path.replaceWith(call);
      },
      NumericLiteral(path) {
        if (path.parent.type === "ObjectProperty") {
          return;
        }
        if (path.node.ignore) {
          return;
        }
        path.node.ignore = true;

        var call = t.callExpression(
          ignoredIdentifier(FunctionNames.doOperation),
          [
            ignoredStringLiteral("numericLiteral"),
            t.arrayExpression([path.node, t.nullLiteral()])
          ]
        );
        call.ignore = true;
        path.replaceWith(call);
      },
      BinaryExpression(path) {
        if (path.node.operator === "+") {
          var call = t.callExpression(
            ignoredIdentifier(FunctionNames.doOperation),
            [
              ignoredStringLiteral(OperationTypes.binaryExpression),
              ignoredStringLiteral("+"),
              t.arrayExpression([path.node.left, getLastOp]),
              t.arrayExpression([path.node.right, getLastOp])
            ]
          );
          call.ignore = true;
          path.replaceWith(call);
        }
      },
      VariableDeclaration(path) {
        if (path.node.ignore) {
          return;
        }
        if (path.parent.type === "ForInStatement") {
          return;
        }
        var originalDeclarations = path.node.declarations;
        var newDeclarations = [];
        originalDeclarations.forEach(function(decl) {
          newDeclarations.push(decl);
          if (!decl.init) {
            decl.init = ignoredIdentifier("undefined");
          }

          newDeclarations.push(
            t.variableDeclarator(
              ignoredIdentifier(decl.id.name + "_t"),
              ignoredCallExpression(
                FunctionNames.getLastOperationTrackingResult,
                []
              )
            )
          );
        });
        path.node.declarations = newDeclarations;
      },
      AssignmentExpression(path) {
        if (path.node.ignore) {
          return;
        }
        path.node.ignore = true;

        if (
          path.node.operator === "=" &&
          path.node.left.type === "MemberExpression"
        ) {
          var property;
          if (path.node.left.computed === true) {
            property = path.node.left.property;
          } else {
            property = babel.types.stringLiteral(path.node.left.property.name);
            property.loc = path.node.left.property.loc;
          }
          let call = createOperation(OperationTypes.objectPropertyAssignment, [
            t.arrayExpression([path.node.left.object, t.nullLiteral()]),
            t.arrayExpression([property, t.nullLiteral()]),
            t.arrayExpression([path.node.right, getLastOp])
          ]);

          call.loc = path.node.loc;
          path.replaceWith(call);
          return;
        }

        if (!path.node.left.name) {
          return;
        }
        const trackingAssignment = runIfIdentifierExists(
          path.node.left.name + "_t",
          t.AssignmentExpression(
            "=",
            ignoredIdentifier(path.node.left.name + "_t"),
            getLastOp
          )
        );
        trackingAssignment.ignore = true;

        var call = t.callExpression(
          ignoredIdentifier(FunctionNames.doOperation),
          [
            ignoredStringLiteral("evaluateAssignment"),
            t.arrayExpression([path.node, t.nullLiteral()])
          ]
        );
        call.ignore = true;

        path.replaceWith(
          t.sequenceExpression([call, trackingAssignment, getLastOpValue])
        );
      },
      ObjectExpression(path) {
        path.node.properties.forEach(function(prop) {
          if (prop.key.type === "Identifier") {
            var keyLoc = prop.key.loc;
            prop.key = babel.types.stringLiteral(prop.key.name);
            prop.key.loc = keyLoc;
            // move start a bit to left to compensate for there not
            // being quotes in the original "string", since
            // it's just an identifier
            if (prop.key.loc.start.column > 0) {
              prop.key.loc.start.column--;
            }
          }
        });

        var call = createOperation(
          OperationTypes.objectExpression,
          path.node.properties.map(function(prop) {
            var type = t.stringLiteral(prop.type);
            type.ignore = true;
            if (prop.type === "ObjectMethod") {
              // getter/setter
              var kind = ignoredStringLiteral(prop.kind);
              kind.ignore = true;
              var propArray = t.arrayExpression([
                t.arrayExpression([type]),
                t.arrayExpression([prop.key]),
                t.arrayExpression(kind),
                t.arrayExpression([
                  babel.types.functionExpression(null, prop.params, prop.body)
                ])
              ]);
              return propArray;
            } else {
              var propArray = t.arrayExpression([
                t.arrayExpression([type]),
                t.arrayExpression([prop.key]),
                t.arrayExpression([prop.value, getLastOp])
              ]);
              return propArray;
            }
            // console.log("continue with type", prop.type);
          })
        );

        path.replaceWith(call);
      },
      MemberExpression(path) {
        if (isInLeftPartOfAssignmentExpression(path)) {
          return;
        }
        if (isInCallExpressionCallee(path)) {
          // don't break this up, the mem exp is needed to know what the correct
          // execution context for the call should be
          return;
        }

        // todo: dedupe this code
        var property;
        if (path.node.property.computed === true) {
          property = path.node.property;
        } else {
          // console.log("nn", path.node.property.name, path.node.property);
          if (path.node.property.type === "Identifier") {
            property = babel.types.stringLiteral(path.node.property.name);
            property.loc = path.node.property.loc;
          } else if (path.node.property.type === "NumericLiteral") {
            property = babel.types.stringLiteral(
              path.node.property.value.toString()
            );
            property.loc = path.node.property.loc;
          } else {
            throw "asdfsdfsd";
          }
        }
        path.replaceWith(
          createOperation(OperationTypes.memberExpression, [
            t.arrayExpression([path.node.object, getLastOp]),
            t.arrayExpression([property, getLastOp])
          ])
        );
      },
      ReturnStatement(path) {
        if (path.ignore) {
          return;
        }
        path.node.ignore = true;

        var opCall = ignoredCallExpression(FunctionNames.doOperation, [
          ignoredStringLiteral(OperationTypes.returnStatement),
          t.arrayExpression([path.node.argument, getLastOp])
        ]);

        path.node.argument = opCall;
      },
      Identifier(path) {
        if (path.node.ignore) {
          return;
        }
        if (
          path.parent.type === "FunctionDeclaration" ||
          path.parent.type === "CallExpression" ||
          path.parent.type === "VariableDeclarator" ||
          path.parent.type === "MemberExpression" ||
          path.parent.type === "AssignmentExpression" ||
          path.parent.type === "ObjectProperty" ||
          path.parent.type === "CatchClause" ||
          path.parent.type === "ForInStatement" ||
          path.parent.type === "IfStatement" ||
          path.parent.type === "ForStatement" ||
          path.parent.type === "FunctionExpression" ||
          path.parent.type === "UpdateExpression" ||
          (path.parent.type === "UnaryExpression" &&
            path.parent.operator === "typeof")
        ) {
          return;
        }
        if (path.node.name === "globalFn") {
          return;
        }

        path.node.ignore = true;

        var call = ignoredCallExpression(FunctionNames.doOperation, [
          ignoredStringLiteral("identifier"),
          t.arrayExpression([
            path.node,
            trackingIdentifierIfExists(path.node.name)
          ])
        ]);

        try {
          path.replaceWith(call);
        } catch (err) {
          console.log(err);
          console.log(path.parent.type);
          throw Error("end");
        }
      },
      CallExpression(path) {
        if (path.node.ignore) {
          return;
        }
        if (isInWhileStatement(path)) {
          return;
        }

        var fn = t.nullLiteral();
        var object = t.nullLiteral();
        var objectKey = t.nullLiteral();
        if (path.node.callee.type === "MemberExpression") {
          object = path.node.callee.object;
          if (path.node.callee.computed) {
            objectKey = path.node.callee.property;
          } else {
            // identifier
            objectKey = t.stringLiteral(path.node.callee.property.name);
          }
        } else {
          fn = path.node.callee;
        }

        var args = [];
        path.node.arguments.forEach(arg => {
          args.push(t.arrayExpression([arg, getLastOp]));
        });

        var call = t.callExpression(ignoredIdentifier(FunctionNames.makeCall), [
          fn,
          object,
          objectKey,
          t.arrayExpression(args)
        ]);
        // call.loc = path.node.callee.loc;
        call.ignore = true;

        // todo: would it be better for perf if I just updated the existing call expression instead?
        path.replaceWith(call);
      }
    }
  };
}

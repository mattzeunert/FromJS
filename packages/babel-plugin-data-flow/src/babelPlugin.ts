import * as FunctionNames from "./FunctionNames";
import * as babel from "@babel/core";
import * as OperationTypes from "./OperationTypes";
import * as fs from "fs";
import * as babylon from "babylon";

let helperCode = fs.readFileSync(__dirname + "/helperFunctions.ts").toString();
helperCode = helperCode.replace(
  "__FUNCTION_NAMES__",
  JSON.stringify(FunctionNames)
);
helperCode = helperCode.replace(
  "__OPERATION_TYPES__",
  JSON.stringify(OperationTypes)
);
// I got some babel-generator "cannot read property 'type' of undefined" errors
// when prepending the code itself, so just prepend a single eval call expression
helperCode = "eval(`" + helperCode + "`)";

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

  function ignoreNode(node){
    node.ignore = true
    return node 
  }

  function runIfIdentifierExists(identifierName, thenNode) {
    const iN = ignoreNode
    return iN(t.logicalExpression(
        "&&",
        iN(t.binaryExpression(
          "!==",
          iN(t.UnaryExpression("typeof", ignoredIdentifier(identifierName))),
          ignoredStringLiteral("undefined")
        ))
        ,
        ignoredIdentifier(identifierName)
      )
    )
  }

  function trackingIdentifierIfExists(identifierName) {
    var trackingIdentifierName = identifierName + "_t"
    return runIfIdentifierExists(trackingIdentifierName, ignoredIdentifier(trackingIdentifierName))
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
        if (!path.node.left.name) {
          return;
        }
        const trackingAssignment = makeTrackingAssignment()t.AssignmentExpression(
          "=",
          t.identifier(path.node.left.name + "_t"),
          getLastOp
        );
        trackingAssignment.ignore = true;

        path.replaceWith(t.sequenceExpression([path.node, trackingAssignment]));
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
          path.parent.type === "FunctionExpression" ||
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

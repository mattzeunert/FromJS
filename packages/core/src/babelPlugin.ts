import * as FunctionNames from "./FunctionNames";
import * as babel from "@babel/core";
import * as OperationTypes from "./OperationTypes";
// import * as fs from "fs";
import * as babylon from "babylon";
import operations, { shouldSkipIdentifier } from "./operations";
import {
  ignoreNode,
  ignoredArrayExpression,
  ignoredStringLiteral,
  ignoredIdentifier,
  ignoredCallExpression,
  ignoredNumericLiteral,
  createOperation,
  getLastOperationTrackingResultCall,
  runIfIdentifierExists,
  isInNodeType,
  isInIdOfVariableDeclarator,
  isInLeftPartOfAssignmentExpression,
  getTrackingVarName,
  addLoc
} from "./babelPluginHelpers";

import helperCodeLoaded from "../helperFunctions";
var helperCode = helperCodeLoaded
  .toString()
  .replace("__FUNCTION_NAMES__", JSON.stringify(FunctionNames));
helperCode = helperCode.replace(
  "__OPERATION_TYPES__",
  JSON.stringify(OperationTypes)
);

var opsExecString = `{`;
Object.keys(operations).forEach(opName => {
  if (!operations[opName].exec) {
    // console.log("no exec for operation", opName);
    return;
  }
  opsExecString += `${opName}: ${operations[opName].exec.toString()},`;
});
opsExecString += `}`;

helperCode = helperCode.replace("__OPERATIONS_EXEC__", opsExecString);

var opsArrayArgumentsString = `{`;
Object.keys(operations).forEach(opName => {
  if (!operations[opName].exec) {
    // console.log("no exec for operation", opName);
    return;
  }
  opsArrayArgumentsString += `${opName}: [${operations[
    opName
  ].arrayArguments!.map(a => `"${a}"`)}],`;
});
opsArrayArgumentsString += `}`;

helperCode = helperCode.replace(
  "__OPERATION_ARRAY_ARGUMENTS__",
  opsArrayArgumentsString
);

helperCode += "/* HELPER_FUNCTIONS_END */ ";

// I got some babel-generator "cannot read property 'type' of undefined" errors
// when prepending the code itself, so just prepend a single eval call expression
helperCode =
  "eval(`" +
  helperCode.replace(/\\/g, "\\\\").replace(/`/g, "\\`") +
  "\n//# sourceURL=/helperFns.js`)";
helperCode += "// aaaaa"; // this seems to help with debugging/evaling the code... not sure why...just take it out if the tests dont break

function plugin(babel) {
  const { types: t } = babel;

  // const str = t.stringLiteral;
  // if (!t["x"]) {
  //   t["x"] = true;
  //   t.stringLiteral = function() {
  //     const node = str.apply(this, arguments);
  //     node.stack = Error().stack;
  //     return node;
  //   };
  // }

  function handleFunction(path) {
    path.node.params.forEach((param, i) => {
      var d = t.variableDeclaration("var", [
        t.variableDeclarator(
          addLoc(ignoredIdentifier(getTrackingVarName(param.name)), param.loc),
          ignoredCallExpression(FunctionNames.getFunctionArgTrackingInfo, [
            ignoredNumericLiteral(i)
          ])
        )
      ]);
      d.ignore = true;
      path.node.body.body.unshift(d);
    });

    var d = t.variableDeclaration("var", [
      // keep whole list in case the function uses `arguments` object
      t.variableDeclarator(
        ignoredIdentifier("__allFnArgTrackingValues"),
        ignoredCallExpression(FunctionNames.getFunctionArgTrackingInfo, [])
      )
    ]);
    d.ignore = true;
    path.node.body.body.unshift(d);
  }

  const visitors = {
    FunctionDeclaration(path) {
      handleFunction(path);
    },

    FunctionExpression(path) {
      handleFunction(path);
    },

    VariableDeclaration(path) {
      if (path.parent.type === "ForInStatement") {
        return;
      }
      var originalDeclarations = path.node.declarations;
      var newDeclarations: any[] = [];
      originalDeclarations.forEach(function(decl) {
        newDeclarations.push(decl);
        if (!decl.init) {
          decl.init = addLoc(ignoredIdentifier("undefined"), decl.loc);
        }

        newDeclarations.push(
          t.variableDeclarator(
            addLoc(
              ignoredIdentifier(getTrackingVarName(decl.id.name)),
              decl.id.loc
            ),
            ignoredCallExpression(
              FunctionNames.getLastOperationTrackingResult,
              []
            )
          )
        );
      });
      path.node.declarations = newDeclarations;
    },

    WithStatement(path) {
      function i(node) {
        if (node.name === null) {
          debugger;
        }
        node.ignoreInWithStatementVisitor = true;
        return node;
      }

      // not an ideal way to track things and might not work for nested
      // with statements, but with statement use should be rare.
      // Underscore uses them for templates though.
      let obj = path.node.object;
      path.get("object").traverse({
        Identifier(path) {
          path.replaceWith(i(path.node));
        }
      });
      path.traverse({
        Identifier(path) {
          if (path.node.ignoreInWithStatementVisitor) {
            return;
          }
          if (shouldSkipIdentifier(path)) {
            return;
          }
          if (
            ["WithStatement", "FunctionExpression"].includes(path.parent.type)
          ) {
            return;
          }
          if (path.parent.type === "MemberExpression") {
            if ((path.parent.property = path.node)) {
              console.log("ignoreing");
              return;
            }
          }
          path.node.ignoreInWithStatementVisitor = true;

          const identifierName = path.node.name;
          path.replaceWith(
            ignoreNode(
              t.conditionalExpression(
                ignoreNode(
                  t.binaryExpression(
                    "in",
                    addLoc(t.stringLiteral(identifierName), path.node.loc),
                    obj
                  )
                ),
                addLoc(
                  t.memberExpression(
                    obj,
                    addLoc(t.stringLiteral(identifierName), path.node.loc),
                    true
                  ),
                  path.node.loc
                ),
                i(addLoc(t.identifier(identifierName), path.node.loc))
              )
            )
          );
        }
      });
    },

    ForInStatement(path) {
      if (path.node.ignore) return;

      let varName;
      let isNewVariable;
      if (path.node.left.type === "VariableDeclaration") {
        varName = path.node.left.declarations[0].id.name;
        isNewVariable = true;
      } else if (path.node.left.type === "Identifier") {
        varName = path.node.left.name;
        isNewVariable = false;
      } else {
        throw Error("not sure what this is");
      }

      path.traverse({
        ExpressionStatement(path) {
          // replace `for (i in k) sth` with `for (i in k) {sth}`
          if (path.parent.type !== "ForInStatement") {
            return;
          }
          path.replaceWith(babel.types.blockStatement([path.node]));
        },
        IfStatement(path) {
          // replace `for (i in k) if () sth` with `for (i in k) {if () sth}`
          if (path.parent.type !== "ForInStatement") {
            return;
          }
          path.replaceWith(babel.types.blockStatement([path.node]));
        },
        ReturnStatement(path) {
          if (path.parent.type !== "ForInStatement") {
            return;
          }
          path.replaceWith(babel.types.blockStatement([path.node]));
        },
        ForStatement(path) {
          // replace `for (i in k) for () abc` with `for (i in k) {for () abc}`
          if (path.parent.type !== "ForInStatement") {
            return;
          }
          path.replaceWith(babel.types.blockStatement([path.node]));
        }
        // TODO: are there other statement types I need to handle???
      });

      if (isNewVariable) {
        var declaration = ignoreNode(
          t.variableDeclaration("var", [
            t.variableDeclarator(ignoredIdentifier(getTrackingVarName(varName)))
          ])
        );
        path.node.body.body.unshift(declaration);
      }

      var assignment = ignoreNode(
        t.assignmentExpression(
          "=",
          ignoredIdentifier(getTrackingVarName(varName)),
          ignoredCallExpression("getObjectPropertyNameTrackingValue", [
            path.node.right,
            ignoredIdentifier(varName)
          ])
        )
      );
      path.node.body.body.unshift(assignment);
    }
  };

  Object.keys(operations).forEach(key => {
    var operation = operations[key];
    key = key[0].toUpperCase() + key.slice(1);
    if (operation.visitor) {
      visitors[key] = path => {
        var ret = operation.visitor.call(operation, path);
        if (ret) {
          if (!ret.loc) {
            // debugger;
          }
          path.replaceWith(ret);
        }
      };
    }
  });

  Object.keys(visitors).forEach(key => {
    var originalVisitor = visitors[key];
    visitors[key] = function(path) {
      if (path.node.ignore) {
        return;
      }
      return originalVisitor.apply(this, arguments);
    };
  });

  visitors["Program"] = {
    // Run on exit so injected code isn't processed by other babel plugins
    exit: function(path) {
      const babelPluginOptions = plugin["babelPluginOptions"];
      let usableHelperCode;
      if (babelPluginOptions) {
        const { accessToken, backendPort } = babelPluginOptions;
        usableHelperCode = helperCode;
        usableHelperCode = usableHelperCode.replace(
          "ACCESS_TOKEN_PLACEHOLDER",
          accessToken
        );
        usableHelperCode = usableHelperCode.replace(
          "BACKEND_PORT_PLACEHOLDER",
          backendPort
        );
      } else {
        usableHelperCode = helperCode;
      }

      var initCodeAstNodes = babylon
        .parse(usableHelperCode)
        .program.body.reverse();
      initCodeAstNodes.forEach(node => {
        path.node.body.unshift(node);
      });
    }
  };

  return {
    name: "fromjs-babel-plugin",
    visitor: visitors
  };
}

export default plugin;

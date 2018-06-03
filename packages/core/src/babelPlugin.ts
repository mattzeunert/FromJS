import * as FunctionNames from "./FunctionNames";
import * as babel from "@babel/core";
import * as OperationTypes from "./OperationTypes";
// import * as fs from "fs";
import * as babylon from "babylon";
import operations from "./operations";
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
  getTrackingVarName
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

  function handleFunction(path) {
    path.node.params.forEach((param, i) => {
      var d = t.variableDeclaration("var", [
        t.variableDeclarator(
          ignoredIdentifier(getTrackingVarName(param.name)),
          ignoredCallExpression(FunctionNames.getFunctionArgTrackingInfo, [
            ignoredNumericLiteral(i)
          ])
        )
      ]);
      d.ignore = true;
      path.node.body.body.unshift(d);
    });
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
          decl.init = ignoredIdentifier("undefined");
        }

        newDeclarations.push(
          t.variableDeclarator(
            ignoredIdentifier(getTrackingVarName(decl.id.name)),
            ignoredCallExpression(
              FunctionNames.getLastOperationTrackingResult,
              []
            )
          )
        );
      });
      path.node.declarations = newDeclarations;
    }
  };

  Object.keys(operations).forEach(key => {
    var operation = operations[key];
    key = key[0].toUpperCase() + key.slice(1);
    if (operation.visitor) {
      visitors[key] = path => {
        var ret = operation.visitor.call(operation, path);
        if (ret) {
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

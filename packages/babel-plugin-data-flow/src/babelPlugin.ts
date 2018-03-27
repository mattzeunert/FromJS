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
  isInLeftPartOfAssignmentExpression
} from "./babelPluginHelpers";

import helperCodeLoaded from "./helperFunctions";
let helperCode = helperCodeLoaded.toString();
helperCode = helperCode.slice("function default_1() {".length, -1);
helperCode = helperCode
  .toString()
  .replace("__FUNCTION_NAMES__", JSON.stringify(FunctionNames));
helperCode = helperCode.replace(
  "__OPERATION_TYPES__",
  JSON.stringify(OperationTypes)
);

var opsExecString = `{`;
Object.keys(operations).forEach(opName => {
  if (!operations[opName].exec) {
    console.log("no exec for operation", opName);
    return;
  }
  opsExecString += `${opName}: ${operations[opName].exec.toString()},`;
});
opsExecString += `}`;

helperCode = helperCode.replace("__OPERATIONS_EXEC__", opsExecString);

var opsArrayArgumentsString = `{`;
Object.keys(operations).forEach(opName => {
  if (!operations[opName].exec) {
    console.log("no exec for operation", opName);
    return;
  }
  opsArrayArgumentsString += `${opName}: [${operations[
    opName
  ].arrayArguments.map(a => `"${a}"`)}],`;
});
opsArrayArgumentsString += `}`;

helperCode = helperCode.replace(
  "__OPERATION_ARRAY_ARGUMENTS__",
  opsArrayArgumentsString
);

helperCode += "/* HELPER_FUNCTIONS_END */ ";

// I got some babel-generator "cannot read property 'type' of undefined" errors
// when prepending the code itself, so just prepend a single eval call expression
helperCode = "eval(`" + helperCode + "`)";
// console.log(helperCode);

export default function plugin(babel) {
  const { types: t } = babel;

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

  function isInCallExpressionCallee(path) {
    return isInNodeType("CallExpression", path, function(path, prevPath) {
      return path.node.callee === prevPath.node;
    });
  }

  function createSetMemoValue(key, value, trackingValue) {
    return ignoredCallExpression("__setMemoValue", [
      ignoredStringLiteral(key),
      value,
      trackingValue
    ]);
  }
  function createGetMemoValue(key) {
    return ignoredCallExpression("__getMemoValue", [ignoredStringLiteral(key)]);
  }
  function createGetMemoTrackingValue(key) {
    return ignoredCallExpression("__getMemoTrackingValue", [
      ignoredStringLiteral(key)
    ]);
  }

  const visitors = {
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

    VariableDeclaration(path) {
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
      path.node.ignore = true;

      let operationArguments = [
        ignoredArrayExpression([
          ignoredStringLiteral(path.node.operator),
          t.nullLiteral()
        ]),
        ignoredArrayExpression([
          ignoredStringLiteral(path.node.left.type),
          t.nullLiteral()
        ])
      ];

      let trackingAssignment = null;

      if (path.node.left.type === "MemberExpression") {
        var property;
        if (path.node.left.computed === true) {
          property = path.node.left.property;
        } else {
          property = babel.types.stringLiteral(path.node.left.property.name);
          property.loc = path.node.left.property.loc;
        }

        operationArguments = operationArguments.concat([
          ignoredArrayExpression([path.node.left.object, t.nullLiteral()]),
          ignoredArrayExpression([property, t.nullLiteral()]),
          ignoredArrayExpression([
            path.node.right,
            getLastOperationTrackingResultCall
          ])
        ]);
      } else if (path.node.left.type === "Identifier") {
        var right = createSetMemoValue(
          "lastAssignmentExpressionArgument",
          path.node.right,
          getLastOperationTrackingResultCall
        );
        path.node.right = right;

        trackingAssignment = runIfIdentifierExists(
          path.node.left.name + "_t",
          ignoreNode(
            t.assignmentExpression(
              "=",
              ignoredIdentifier(path.node.left.name + "_t"),
              getLastOperationTrackingResultCall
            )
          )
        );
        trackingAssignment.ignore = true;

        path.node.left.ignore = true;
        path.node.ignore = true;
        operationArguments = operationArguments.concat([
          ignoredArrayExpression([
            path.node.left,
            getLastOperationTrackingResultCall
          ]),
          ignoredArrayExpression([
            path.node,
            getLastOperationTrackingResultCall
          ]),
          ignoredArrayExpression([
            createGetMemoValue("lastAssignmentExpressionArgument"),
            createGetMemoTrackingValue("lastAssignmentExpressionArgument")
          ])
        ]);
      } else {
        throw Error("unhandled assignmentexpression node.left type");
      }

      const operation = createOperation(
        "assignmentExpression",
        operationArguments
      );

      if (trackingAssignment) {
        path.replaceWith(
          t.sequenceExpression([operation, trackingAssignment, getLastOpValue])
        );
      } else {
        path.replaceWith(operation);
      }
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
      var initCodeAstNodes = babylon.parse(helperCode).program.body.reverse();
      initCodeAstNodes.forEach(node => {
        path.node.body.unshift(node);
      });
    }
  };

  return {
    name: "babel-plugin-data-flow",
    visitor: visitors
  };
}

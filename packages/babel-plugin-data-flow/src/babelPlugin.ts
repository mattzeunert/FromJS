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
  getLastOperationTrackingResultCall
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

  function isInLeftPartOfAssignmentExpression(path) {
    return isInNodeType("AssignmentExpression", path, function(path, prevPath) {
      return path.node.left === prevPath.node;
    });
  }

  function isInIdOfVariableDeclarator(path) {
    return isInNodeType("VariableDeclarator", path, function(path, prevPath) {
      return path.node.id === prevPath.node;
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
        thenNode
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

    BinaryExpression(path) {
      if (["+", "-", "/", "*"].includes(path.node.operator)) {
        path.replaceWith(
          operations.binaryExpression.createNode(
            {
              left: [path.node.left, getLastOperationTrackingResultCall],
              right: [path.node.right, getLastOperationTrackingResultCall]
            },
            { operator: ignoredStringLiteral(path.node.operator) }
          )
        );
      }
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
            var propArray = ignoredArrayExpression([
              ignoredArrayExpression([type]),
              ignoredArrayExpression([prop.key]),
              ignoredArrayExpression(kind),
              ignoredArrayExpression([
                babel.types.functionExpression(null, prop.params, prop.body)
              ])
            ]);
            return propArray;
          } else {
            var propArray = ignoredArrayExpression([
              ignoredArrayExpression([type]),
              ignoredArrayExpression([prop.key]),
              ignoredArrayExpression([
                prop.value,
                getLastOperationTrackingResultCall
              ])
            ]);
            return propArray;
          }
          // console.log("continue with type", prop.type);
        })
      );

      path.replaceWith(call);
    },
    Identifier(path) {
      if (
        path.parent.type === "FunctionDeclaration" ||
        path.parent.type === "CallExpression" ||
        path.parent.type === "MemberExpression" ||
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
      if (
        isInLeftPartOfAssignmentExpression(path) ||
        isInIdOfVariableDeclarator(path)
      ) {
        return;
      }
      if (path.node.name === "globalFn") {
        return;
      }

      path.node.ignore = true;

      var call = ignoredCallExpression(FunctionNames.doOperation, [
        ignoredStringLiteral("identifier"),
        ignoredArrayExpression([
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
      const { callee } = path.node;

      var isMemberExpressionCall = callee.type === "MemberExpression";

      var args = [];
      path.node.arguments.forEach(arg => {
        args.push(
          ignoredArrayExpression([arg, getLastOperationTrackingResultCall])
        );
      });

      let executionContext;
      let executionContextTrackingValue;
      if (isMemberExpressionCall) {
        executionContext = ignoredCallExpression(
          "getLastMemberExpressionObjectValue",
          []
        );
        executionContextTrackingValue = ignoredCallExpression(
          "getLastMemberExpressionObjectTrackingValue",
          []
        );
      } else {
        executionContext = t.identifier("undefined");
        executionContextTrackingValue = t.nullLiteral();
      }

      var fnArgs = {};
      args.forEach((arg, i) => {
        fnArgs["arg" + i] = arg;
      });

      var call = operations.callExpression.createNode({
        function: [
          ignoreNode(path.node.callee),
          isMemberExpressionCall
            ? getLastOperationTrackingResultCall
            : getLastOperationTrackingResultCall
        ],
        context: [executionContext, executionContextTrackingValue],
        ...fnArgs
      });

      // todo: would it be better for perf if I just updated the existing call expression instead?
      path.replaceWith(call);
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

  visitors["MemberExpression"] = path => {
    // this fn does not have if (path.node.ignore){return} and if
    // i add it it breaks tests, not sure why
    if (isInLeftPartOfAssignmentExpression(path)) {
      return;
    }
    if (path.parent.type === "UpdateExpression") {
      return;
    }

    // todo: dedupe this code
    var property;
    if (path.node.computed === true) {
      property = path.node.property;
    } else {
      if (path.node.property.type === "Identifier") {
        property = babel.types.stringLiteral(path.node.property.name);
        property.loc = path.node.property.loc;
      }
    }

    const op = operations.memberExpression.createNode({
      object: [path.node.object, getLastOperationTrackingResultCall],
      propName: [property, getLastOperationTrackingResultCall]
    });

    path.replaceWith(op);
  };

  return {
    name: "babel-plugin-data-flow",
    visitor: visitors
  };
}

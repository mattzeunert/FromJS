import { ExecContext } from "../helperFunctions/ExecContext";
import {
  getLastOperationTrackingResultCall,
  ignoredStringLiteral,
  runIfIdentifierExists,
  ignoredArrayExpression,
  createGetMemoArray,
  getLastOpValueCall,
  ignoredIdentifier,
  getTrackingVarName,
  ignoreNode,
  createSetMemoValue,
  getLastOperationTrackingResultWithoutResettingCall,
  getTrackingIdentifier
} from "../babelPluginHelpers";
import traverseStringConcat from "../traverseStringConcat";
import mapInnerHTMLAssignment from "./domHelpers/mapInnerHTMLAssignment";
import addElOrigin from "./domHelpers/addElOrigin";
import * as MemoValueNames from "../MemoValueNames";

export default <any>{
  exec: (args, astArgs, ctx: ExecContext, logData: any) => {
    var ret;
    const assignmentType = args.type[0];
    const operator = astArgs.operator;
    if (assignmentType === "MemberExpression") {
      var obj = args.object[0];
      var propName = args.propertyName[0];
      var objT = args.object[1];
      var propNameT = args.propertyName[1];

      var currentValue = obj[propName];
      var currentValueT = ctx.createOperationLog({
        operation: "memexpAsLeftAssExp",
        args: {
          object: [obj, objT],
          propertyName: [propName, propNameT]
        },
        extraArgs: {
          propertyValue: [
            currentValue,
            ctx.getObjectPropertyTrackingValue(obj, propName)
          ]
        },
        astArgs: {},
        result: currentValue,
        loc: logData.loc
      });

      var argument = args.argument[0];
      switch (operator) {
        case "=":
          ret = obj[propName] = argument;
          break;
        case "+=":
          ret = obj[propName] = obj[propName] + argument;
          break;
        case "-=":
          ret = obj[propName] = obj[propName] - argument;
          break;
        case "|=":
          ret = obj[propName] = obj[propName] |= argument;
          break;
        case "&=":
          ret = obj[propName] = obj[propName] &= argument;
          break;
        default:
          throw Error("unknown operator " + operator);
      }

      ctx.trackObjectPropertyAssignment(
        obj,
        propName,
        ctx.createOperationLog({
          result: ret,
          operation: "assignmentExpression",
          args: {
            currentValue: [currentValue, currentValueT],
            argument: args.argument
          },
          astArgs: {
            operator
          },
          loc: logData.loc,
          argTrackingValues: [currentValueT, args.argument[1]],
          argNames: ["currentValue", "argument"]
        }),
        propNameT
      );

      if (obj instanceof HTMLElement && propName === "innerHTML") {
        mapInnerHTMLAssignment(obj, args.argument, "assignInnerHTML", 0);
      } else if (obj instanceof HTMLElement && propName === "textContent") {
        if (obj.nodeType === Node.TEXT_NODE) {
          addElOrigin(obj, "textContent", {
            trackingValue: args.argument[1]
          });
        } else if (obj.nodeType === Node.ELEMENT_NODE) {
          if (obj.childNodes.length > 0) {
            // can be 0 still if textValue is ""
            addElOrigin(obj.childNodes[0], "textValue", {
              trackingValue: args.argument[1]
            });
          }
        } else {
          console.log("do i need to handle this? can this even happen?");
        }
      }
    } else if (assignmentType === "Identifier") {
      ret = args.newValue[0];
    } else {
      throw Error("unknown: " + assignmentType);
    }
    return ret;
  },
  traverse(operationLog, charIndex) {
    const { operator } = operationLog.astArgs;
    if (operator === "=") {
      return {
        operationLog: operationLog.args.argument,
        charIndex: charIndex
      };
    } else if (operator === "+=") {
      return traverseStringConcat(
        operationLog.args.currentValue,
        operationLog.args.argument,
        charIndex
      );
    } else {
      return;
    }
  },
  visitor(path) {
    path.node.ignore = true;

    let operationArguments = {
      type: ignoredArrayExpression([ignoredStringLiteral(path.node.left.type)])
    };

    let trackingAssignment: any = null;

    if (path.node.left.type === "MemberExpression") {
      var property;
      if (path.node.left.computed === true) {
        property = path.node.left.property;
      } else {
        property = this.t.stringLiteral(path.node.left.property.name);
        property.note = "assexp";
        property.loc = path.node.left.property.loc;
      }

      operationArguments["object"] = [
        path.node.left.object,
        getLastOperationTrackingResultCall()
      ];
      operationArguments["propertyName"] = [
        property,
        getLastOperationTrackingResultCall()
      ];
      operationArguments["argument"] = [
        path.node.right,
        getLastOperationTrackingResultCall()
      ];
    } else if (path.node.left.type === "Identifier") {
      var right = createSetMemoValue(
        MemoValueNames.lastAssignmentExpressionArgument,
        path.node.right,
        getLastOperationTrackingResultCall()
      );
      path.node.right = right;

      trackingAssignment = runIfIdentifierExists(
        getTrackingVarName(path.node.left.name),
        ignoreNode(
          this.t.assignmentExpression(
            "=",
            getTrackingIdentifier(path.node.left.name),
            // Normally we want to reset the value after an operation, but the problem is
            // that after the tracking assignment the result value of the assignment operation could
            // be read.
            // Like this: `a = (b = 4)`
            // If we use reset the last tracking value the `a =` assignment will lose the tracking value
            // (In theory we could detect if the result is used somehow and only not reset if we know it's used
            // base on the AST)
            getLastOperationTrackingResultWithoutResettingCall()
          )
        )
      );

      const identifierAssignedTo = path.node.left;
      // we have to check if it exists because outside strict mode
      // you can assign to undeclared global variables
      const identifierValue = runIfIdentifierExists(
        identifierAssignedTo.name,
        identifierAssignedTo
      );

      operationArguments["currentValue"] = ignoredArrayExpression([
        identifierValue,
        getLastOperationTrackingResultCall()
      ]);
      (operationArguments["newValue"] = ignoredArrayExpression([
        path.node,
        getLastOperationTrackingResultCall()
      ])),
        (operationArguments["argument"] = createGetMemoArray(
          MemoValueNames.lastAssignmentExpressionArgument
        ));
    } else {
      throw Error("unhandled assignmentexpression node.left type");
    }

    const operation = this.createNode!(
      operationArguments,
      {
        operator: ignoredStringLiteral(path.node.operator)
      },
      path.node.loc
    );

    if (trackingAssignment) {
      path.replaceWith(
        this.t.sequenceExpression([
          operation,
          trackingAssignment,
          getLastOpValueCall()
        ])
      );
    } else {
      path.replaceWith(operation);
    }
  }
};

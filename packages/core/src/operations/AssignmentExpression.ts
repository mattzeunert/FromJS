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
  createSetMemoValue
} from "../babelPluginHelpers";
import traverseStringConcat from "../traverseStringConcat";
import mapInnerHTMLAssignment from "./domHelpers/mapInnerHTMLAssignment";
import addElOrigin from "./domHelpers/addElOrigin";

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
          ret = obj[propName] = obj[propName] + argument;
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
          result: args.argument[0],
          operation: "assignmentExpression",
          args: {
            currentValue: [currentValue, currentValueT],
            argument: args.argument
          },
          astArgs: {
            operator: "="
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
            inputValues: [args.argument]
          });
        } else if (obj.nodeType === Node.ELEMENT_NODE) {
          addElOrigin(obj.childNodes[0], "textValue", {
            inputValues: [args.argument]
          });
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
        "lastAssignmentExpressionArgument",
        path.node.right,
        getLastOperationTrackingResultCall()
      );
      path.node.right = right;

      trackingAssignment = runIfIdentifierExists(
        getTrackingVarName(path.node.left.name),
        ignoreNode(
          this.t.assignmentExpression(
            "=",
            ignoredIdentifier(getTrackingVarName(path.node.left.name)),
            getLastOperationTrackingResultCall()
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
          "lastAssignmentExpressionArgument"
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

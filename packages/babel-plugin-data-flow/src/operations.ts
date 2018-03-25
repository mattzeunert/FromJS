import * as OperationTypes from "./OperationTypes";
import { createOperation, ignoredArrayExpression } from "./babelPluginHelpers";

function createNode(args, astArgs = null) {}

interface Operations {
  [key: string]: {
    createNode?: any;
    exec: any;
  };
}

const operations: Operations = {
  memberExpression: {
    exec: (args, astArgs, ctx) => {
      var ret;
      var object = args.object[0];
      var objectT = args.object[1];
      var propertyName = args.propName[0];
      ret = object[propertyName];
      ctx.setters.extraArgTrackingValues({
        propertyValue: [
          ret,
          ctx.getObjectPropertyTrackingValue(object, propertyName)
        ]
      });

      ctx.setters.lastMemberExpressionResult([object, objectT]);

      return ret;
    }
  },
  binaryExpression: {
    exec: (args, astArgs, ctx) => {
      var { left, right } = args;
      var ret;
      left = left[0];
      right = right[0];

      var { operator } = astArgs;
      if (operator === "+") {
        ret = left + right;
      } else if (operator === "-") {
        ret = left - right;
      } else if (operator === "*") {
        ret = left * right;
      } else if (operator === "/") {
        ret = left / right;
      } else {
        throw Error("unknown bin exp operator: " + operator);
      }

      return ret;
    }
  },
  callExpression: {
    exec: (args, astArgs, ctx) => {
      var i = 0;
      var arg;
      var fnArgs = [];
      var fnArgValues = [];
      while ((arg = args["arg" + i])) {
        fnArgValues.push(arg[0]);
        fnArgs.push({
          type: ctx.operationTypes.functionArgument,
          argValues: [ret],
          argTrackingValues: [arg[1]],
          resVal: [arg[0]]
        });
        i++;
      }

      ctx.setters.argTrackingInfo(fnArgs);

      var fn = args.function[0];
      var object = args.context[0];
      var ret = fn.apply(object, fnArgValues);
      ctx.setters.argTrackingInfo(null);

      ctx.setters.extraArgTrackingValues({
        returnValue: [ret, ctx.getLastOpTrackingResult()] // pick up value from returnStatement
      });

      return ret;
    }
  }
};

Object.keys(operations).forEach(opName => {
  const operation = operations[opName];
  operation.createNode = function(args, astArgs) {
    return createOperation(OperationTypes[opName], args, astArgs);
  };
});

export default operations;

import * as OperationTypes from "./OperationTypes";
import { createOperation, ignoredArrayExpression } from "./babelPluginHelpers";

function createNode(args, astArgs = null) {}

const operations = {
  memberExpression: {
    createNode: null,
    exec: (args, astArgs, setters, fns) => {
      var ret;
      var object = args.object[0];
      var objectT = args.object[1];
      var propertyName = args.propName[0];
      ret = object[propertyName];
      setters.extraArgTrackingValues({
        propertyValue: [
          ret,
          fns.getObjectPropertyTrackingValue(object, propertyName)
        ]
      });

      setters.lastMemberExpressionResult([object, objectT]);

      return ret;
    }
  },
  binaryExpression: {
    createNode: null,
    exec: (args, astArgs) => {
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
  callExpression: { createNode: null }
};

Object.keys(operations).forEach(opName => {
  const operation = operations[opName];
  operation.createNode = function(args, astArgs) {
    return createOperation(OperationTypes[opName], args, astArgs);
  };
});

export default operations;

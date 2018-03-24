import * as OperationTypes from "./OperationTypes";
import { createOperation, ignoredArrayExpression } from "./babelPluginHelpers";

function createNode(args, astArgs = null) {}

const operations = {
  memberExpression: { createNode: null },
  binaryExpression: { createNode: null }
};

Object.keys(operations).forEach(opName => {
  const operation = operations[opName];
  operation.createNode = function(args, astArgs) {
    return createOperation(OperationTypes[opName], args, astArgs);
  };
});

export default operations;

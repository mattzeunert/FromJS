import * as OperationTypes from "./OperationTypes";
import { createOperation, ignoredArrayExpression } from "./babelPluginHelpers";

const operations = {
  memberExpression: {
    createNode({ object, propName }) {
      return createOperation(OperationTypes.memberExpression, {
        object,
        propName
      });
    }
  },
  binaryExpression: {
    createNode({ left, right }, { operator }) {
      return createOperation(
        OperationTypes.binaryExpression,
        {
          left,
          right
        },
        { operator }
      );
    }
  }
};

export default operations;

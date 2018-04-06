import * as OperationTypes from "./OperationTypes";
import operations from "./operations";
import OperationLog from "./helperFunctions/OperationLog";

export default function traverse(
  operationLog: OperationLog,
  charIndex,
  steps = []
) {
  steps.push({
    operationLog: operationLog,
    charIndex
  });
  // console.log("Traversing", { operationLog, a: operationLog.args, charIndex });
  let nextStep = null;

  if (typeof operationLog === "number") {
    throw Error("trying to traverse unloaded (numeric) operation log");
  }

  const operation = operations[operationLog.operation];
  debugger;
  if (operation && operation.traverse) {
    nextStep = operation.traverse(operationLog, charIndex);
  } else {
    switch (operationLog.operation) {
      case OperationTypes.functionArgument:
        nextStep = {
          operationLog: operationLog.args.value,
          charIndex: charIndex
        };
        break;
    }
  }

  if (nextStep && nextStep.operationLog) {
    traverse(nextStep.operationLog, nextStep.charIndex, steps);
  }
  // console.log(steps);
  return steps;
}

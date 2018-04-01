import * as OperationTypes from "./OperationTypes";
import operations from "./operations"

export default function traverse(operationLog, charIndex, steps = []) {
  steps.push({
    operationLog: operationLog,
    charIndex
  });
  // console.log("Traversing", { operationLog, a: operationLog.args, charIndex });
  let nextStep = null;

  const operation = operations[operationLog.operation]
  if (operation && operation.traverse) {
    nextStep = operation.traverse(operationLog, charIndex)
  } else {
    switch (operationLog.operation) {
      case OperationTypes.memberExpression:
        nextStep = {
          operationLog: operationLog.extraArgs.propertyValue,
          charIndex: charIndex
        };

        break;
      case OperationTypes.callExpression:

        var knownFunction = operationLog.args.function.result.knownValue
        if (knownFunction) {
          switch (knownFunction) {
            case "String.prototype.slice":
              nextStep = {
                operationLog: operationLog.args.context,
                charIndex: charIndex + operationLog.args.arg0.result.primitive
              }
              break;
          }
        } else {
          nextStep = {
            operationLog: operationLog.extraArgs.returnValue,
            charIndex: charIndex
          };
        }
        break;
      case OperationTypes.functionArgument:
        nextStep = {
          operationLog: operationLog.args.value,
          charIndex: charIndex
        };
        break;
      case OperationTypes.objectExpression:
        nextStep = {
          operationLog: operationLog.args.propertyValue,
          charIndex: charIndex
        };
        break;
      case OperationTypes.assignmentExpression:
        nextStep = {
          operationLog: operationLog.args.argument,
          charIndex: charIndex
        };
        break;
      case OperationTypes.identifier:
        nextStep = {
          operationLog: operationLog.args.value,
          charIndex: charIndex
        };
        break;
      case OperationTypes.returnStatement:
        nextStep = {
          operationLog: operationLog.args.returnValue,
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

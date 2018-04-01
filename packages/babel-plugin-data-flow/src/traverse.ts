import * as OperationTypes from "./OperationTypes";
import operations from "./operations"

export default function traverse(operationLog, charIndex, steps = []) {
  steps.push({
    operationLog: operationLog,
    charIndex
  });
  // console.log("Traversing", { operationLog, charIndex });
  let nextStep = null;

  const operation = operations[operationLog.operation]
  if (operation && operation.traverse) {
    nextStep = operation.traverse(operationLog, charIndex)
  } else {
    switch (operationLog.operation) {
      case OperationTypes.memberExpression:
        nextStep = {
          operationLog: operationLog.extraArgs.propertyValue[1],
          charIndex: charIndex
        };

        break;
      case OperationTypes.callExpression:

        var knownFunction = operationLog.args.function[1].result.knownValue
        if (knownFunction) {
          switch (knownFunction) {
            case "String.prototype.slice":
              nextStep = {
                operationLog: operationLog.args.context[1],
                charIndex: charIndex + parseFloat(operationLog.args.arg0[1].result.str)
              }
              break;
          }
        } else {
          nextStep = {
            operationLog: operationLog.extraArgs.returnValue[1],
            charIndex: charIndex
          };
        }
        break;
      case OperationTypes.functionArgument:
        nextStep = {
          operationLog: operationLog.args.value[1],
          charIndex: charIndex
        };
        break;
      case OperationTypes.objectExpression:
        nextStep = {
          operationLog: operationLog.args.propertyValue[1],
          charIndex: charIndex
        };
        break;
      case OperationTypes.assignmentExpression:
        nextStep = {
          operationLog: operationLog.args.argument[1],
          charIndex: charIndex
        };
        break;
      case OperationTypes.identifier:
        nextStep = {
          operationLog: operationLog.args.value[1],
          charIndex: charIndex
        };
        break;
      case OperationTypes.returnStatement:
        nextStep = {
          operationLog: operationLog.args.returnValue[1],
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

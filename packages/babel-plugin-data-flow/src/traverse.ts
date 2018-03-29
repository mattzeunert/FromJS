// TODO: traverse should be a separate module -- maybe?
import * as OperationTypes from "./OperationTypes";

export default function traverse(trackingValue, charIndex, steps = []) {
  steps.push({
    trackingValue,
    charIndex
  });
  // console.log("Traversing", { trackingValue, charIndex });
  let nextStep = null;
  switch (trackingValue.operation) {
    case OperationTypes.binaryExpression:
      const { operator } = trackingValue.astArgs;
      const [left, leftTracking] = trackingValue.args.left;
      const [right, rightTracking] = trackingValue.args.right;
      if (operator == "+") {
        if (typeof left === "string" && typeof right === "string") {
          if (charIndex < left.length) {
            nextStep = {
              trackingValue: leftTracking,
              charIndex: charIndex
            };
          } else {
            nextStep = {
              trackingValue: rightTracking,
              charIndex: charIndex - left.length
            };
          }
        } else {
          console.log("todo");
        }
      } else {
        console.log("todo binexp operator");
      }
      break;
    case OperationTypes.memberExpression:
      nextStep = {
        trackingValue: trackingValue.extraArgs.propertyValue[1],
        charIndex: charIndex
      };
      break;
    case OperationTypes.callExpression:

      var knownFunction = trackingValue.args.function[1].result.knownValue
      if (knownFunction) {
        switch (knownFunction) {
          case "String.prototype.slice":
            nextStep = {
              trackingValue: trackingValue.args.context[1],
              charIndex: charIndex + parseFloat(trackingValue.args.arg0[1].result.str)
            }
            break;
        }
      } else {
        nextStep = {
          trackingValue: trackingValue.extraArgs.returnValue[1],
          charIndex: charIndex
        };
      }
      break;
    case OperationTypes.functionArgument:
      nextStep = {
        trackingValue: trackingValue.args.value[1],
        charIndex: charIndex
      };
      break;
    case OperationTypes.objectExpression:
      nextStep = {
        trackingValue: trackingValue.args.propertyValue[1],
        charIndex: charIndex
      };
      break;
    case OperationTypes.assignmentExpression:
      nextStep = {
        trackingValue: trackingValue.args.argument[1],
        charIndex: charIndex
      };
      break;
    case OperationTypes.identifier:
      nextStep = {
        trackingValue: trackingValue.args.value[1],
        charIndex: charIndex
      };
      break;
    case OperationTypes.returnStatement:
      nextStep = {
        trackingValue: trackingValue.args.returnValue[1],
        charIndex: charIndex
      };
      break;
  }
  if (nextStep && nextStep.trackingValue) {
    traverse(nextStep.trackingValue, nextStep.charIndex, steps);
  }
  // console.log(steps);
  return steps;
}

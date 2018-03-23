// TODO: traverse should be a separate module -- maybe?
import * as OperationTypes from "./OperationTypes";

export default function traverse(trackingValue, charIndex, steps = []) {
  steps.push({
    trackingValue,
    charIndex
  });
  // console.log("Traversing", { trackingValue, charIndex });
  let nextStep = null;
  switch (trackingValue.type) {
    case OperationTypes.binaryExpression:
      const operator = trackingValue.argValues[0];
      const left = trackingValue.argValues[1];
      const leftTracking = trackingValue.argTrackingValues[1];
      const right = trackingValue.argValues[2];
      const rightTracking = trackingValue.argTrackingValues[2];
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
    case OperationTypes.functionReturnValue:
      nextStep = {
        trackingValue: trackingValue.extraTrackingValues[0],
        charIndex: charIndex
      };
      break;
    case OperationTypes.functionArgument:
      nextStep = {
        trackingValue: trackingValue.argTrackingValues[0],
        charIndex: charIndex
      };
      break;
    case OperationTypes.objectExpression:
      nextStep = {
        trackingValue: trackingValue.argTrackingValues[0],
        charIndex: charIndex
      };
      break;
    case OperationTypes.assignmentExpression:
      nextStep = {
        trackingValue: trackingValue.argTrackingValues[1],
        charIndex: charIndex
      };
      break;
    case OperationTypes.identifier:
    case OperationTypes.returnStatement:
      nextStep = {
        trackingValue: trackingValue.argTrackingValues[0],
        charIndex: charIndex
      };
      break;
  }
  if (nextStep) {
    traverse(nextStep.trackingValue, nextStep.charIndex, steps);
  }
  // console.log(steps);
  return steps;
}

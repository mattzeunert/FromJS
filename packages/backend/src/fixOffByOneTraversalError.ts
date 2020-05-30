export function fixOffByOneTraversalError(step, nextStep) {
  if (
    typeof step.operationLog._result === "string" &&
    typeof nextStep.operationLog._result === "string"
  ) {
    let charBefore = step.operationLog._result[step.charIndex];
    let charNow = nextStep.operationLog._result[nextStep.charIndex];
    console.log({ charBefore, charNow });
    if (charNow !== charBefore) {
      let prevCharNow = nextStep.operationLog._result[nextStep.charIndex - 1];
      let nextCharNow = nextStep.operationLog._result[nextStep.charIndex + 1];

      console.log("char doesn't match after traversal step", {
        charNow,
        charBefore,
        prevCharNow,
        nextCharNow,
      });

      // YOLO: try to fix off-by-one errors
      if (prevCharNow === charBefore) {
        nextStep.charIndex -= 1;
        console.log("Auto-fixed off by one error");
      } else if (nextCharNow === charBefore) {
        nextStep.charIndex += 1;
        console.log("Auto-fixed off by one error");
      }
    }
  }
}

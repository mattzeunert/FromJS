import { operations, OperationLog } from "@fromjs/core";

export interface TraversalStep {
  charIndex: number;
  operationLog: OperationLog;
}

export default function traverse(
  step: TraversalStep,
  steps: TraversalStep[] = []
) {
  steps.push(step);
  // console.log("Traversing", { operationLog, a: operationLog.args, charIndex });
  let nextStep: TraversalStep = null;

  if (typeof step.operationLog === "number") {
    throw Error("trying to traverse unloaded (numeric) operation log");
  }

  const { operationLog, charIndex } = step;

  const operation = operations[operationLog.operation];
  if (operation && operation.traverse) {
    nextStep = operation.traverse(operationLog, charIndex);
  } else {
    switch (operationLog.operation) {
      case "functionArgument":
        nextStep = {
          operationLog: operationLog.args.value,
          charIndex: charIndex
        };
        break;
    }
  }

  if (nextStep && nextStep.operationLog) {
    traverse(nextStep, steps);
  }
  // console.log(steps);
  return steps;
}

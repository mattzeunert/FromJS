import { operations, OperationLog } from "@fromjs/core";

export interface TraversalStep {
  charIndex: number;
  operationLog: OperationLog;
}

export async function traverse(
  step: TraversalStep,
  steps: TraversalStep[] = [],
  server
) {
  return new Promise(async resolve => {
    let nextStep: TraversalStep | null | undefined = null;

    let { operationLog, charIndex } = step;

    operationLog = await server.loadLogAwaitable(operationLog, 5);

    steps.push({
      ...step,
      operationLog // overwrite numeric operation log with object
    });

    // console.log("Traversing", { operationLog, a: operationLog.args, charIndex });

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

    const hasEmptyStepResult =
      nextStep &&
      nextStep.operationLog &&
      nextStep.operationLog.result.str === "";
    if (nextStep && nextStep.operationLog && !hasEmptyStepResult) {
      traverse(nextStep, steps, server).then(() => {
        resolve(steps);
      });
    } else {
      if (hasEmptyStepResult) {
        console.log(
          "hmm need to look into this... still traversing but step result is empty"
        );
      }
      resolve(steps);
    }
  });
}

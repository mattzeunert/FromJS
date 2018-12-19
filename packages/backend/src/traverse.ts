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
  return new Promise(async (resolve, reject) => {
    let nextStep: TraversalStep | null | undefined = null;

    let { operationLog, charIndex } = step;

    try {
      operationLog = await server.loadLogAwaitable(operationLog, 5);
    } catch (err) {
      reject(err);
    }

    steps.push({
      ...step,
      operationLog // overwrite numeric operation log with object
    });

    if (steps.length > 2000) {
      throw Error("Too many steps");
    }

    // console.log("Traversing", { operationLog, a: operationLog.args, charIndex });

    const operation = operations[operationLog.operation];
    if (operation && operation.traverse) {
      try {
        nextStep = operation.traverse(operationLog, charIndex);
      } catch (err) {
        console.log("traverse err", operationLog.operation, err);
      }
    }

    if (nextStep && typeof nextStep.operationLog === "number") {
      try {
        nextStep.operationLog = await server.loadLogAwaitable(
          nextStep.operationLog,
          5
        );
      } catch (err) {
        reject(err);
      }
    }

    const hasEmptyStepResult =
      nextStep &&
      nextStep.operationLog &&
      nextStep.operationLog.result.primitive === "";
    if (nextStep && nextStep.operationLog && !hasEmptyStepResult) {
      traverse(nextStep, steps, server)
        .then(() => {
          resolve(steps);
        })
        .catch(err => {
          console.log(err);
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

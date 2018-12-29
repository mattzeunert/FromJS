import { operations, OperationLog } from "@fromjs/core";

export interface TraversalStep {
  charIndex: number;
  operationLog: OperationLog;
  // Optimistic steps are taken when the string value is modified, but
  // we still feel confident the user is interested in one particular argument
  isOptimistic?: boolean;
}

export async function traverse(
  step: TraversalStep,
  steps: TraversalStep[] = [],
  server,
  options: any
) {
  const { optimistic } = options;
  return new Promise(async (resolve, reject) => {
    let nextStep: TraversalStep | null | undefined = null;

    let { operationLog, charIndex } = step;

    try {
      operationLog = await server.loadLogAwaitable(operationLog, 5);
    } catch (err) {
      reject(err);
    }

    const alreadyHasOptimisticStep = steps.some(st => !!st.isOptimistic);

    const stepIsOptimisitc = step.isOptimistic || alreadyHasOptimisticStep;

    steps.push({
      ...step,
      isOptimistic: stepIsOptimisitc,
      operationLog // overwrite numeric operation log with object
    });

    if (steps.length > 2000) {
      throw Error("Too many steps");
    }

    const operation = operations[operationLog.operation];
    if (operation && operation.traverse) {
      try {
        nextStep = operation.traverse(operationLog, charIndex, options);
      } catch (err) {
        console.log(JSON.stringify(operationLog));
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
      traverse(nextStep, steps, server, options)
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

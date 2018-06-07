import { branch, root } from "baobab-react/higher-order";
import * as React from "react";
import TraversalStep from "./TraversalStep";

type TraversalStepsProps = {
  steps?: any[];
};
let TraversalSteps = class TraversalSteps extends React.Component<
  TraversalStepsProps,
  {}
> {
  render() {
    let stepsToShow = [];
    let steps = this.props.steps;
    if (!steps.length) {
      return null;
    }

    stepsToShow = steps;

    const interestingSteps = [];
    let previousStep = steps[0];
    for (var i = 1; i < steps.length - 1; i++) {
      const step = steps[i];
      const previousStepCriteria = getStepInterestingnessCriteria(previousStep);
      const stepCriteria = getStepInterestingnessCriteria(step);

      console.log(step);
      if (step.operationLog.operation === "jsonParseResult") {
        // debugger;
      }
      if (
        previousStepCriteria.charsAfter !== stepCriteria.charsAfter ||
        previousStepCriteria.charsBefore !== stepCriteria.charsBefore
      ) {
        interestingSteps.push(step);
      }
      previousStep = step;
    }

    function getStepInterestingnessCriteria(step) {
      let str = step.operationLog.result.str;

      let charIndexTwoCharsBefore = step.charIndex - 2;
      if (charIndexTwoCharsBefore < 0) {
        charIndexTwoCharsBefore = 0;
      }
      let charIndexTwoCharsAfter = step.charIndex + 2;
      if (charIndexTwoCharsAfter > str.length - 1) {
        charIndexTwoCharsAfter = str.length - 1;
      }
      return {
        charsBefore: str.slice(charIndexTwoCharsBefore, step.charIndex),
        charsAfter: str.slice(step.charIndex, charIndexTwoCharsAfter)
      };
    }

    return (
      <div>
        <div>Inspected step:</div>
        <TraversalStep key={steps[0].operationLog.index} step={steps[0]} />
        <div>First step where selected character was introduced:</div>
        <TraversalStep
          key={steps[steps.length - 1].operationLog.index}
          step={steps[steps.length - 1]}
        />
        <hr />
        <hr />
        <div>Relevant code:</div>
        {interestingSteps.map(step => (
          <TraversalStep key={step.operationLog.index} step={step} />
        ))
        /* .reverse() */
        }
        <hr />
        <hr />
        <div>Full data flow:</div>
        {stepsToShow.map(step => (
          <TraversalStep key={step.operationLog.index} step={step} />
        ))
        /* .reverse() */
        }
      </div>
    );
  }
};

TraversalSteps = branch(
  {
    debugMode: ["debugMode"],
    steps: ["steps"]
  },
  TraversalSteps
);

export default TraversalSteps;

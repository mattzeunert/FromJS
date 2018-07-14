import { branch, root } from "baobab-react/higher-order";
import * as React from "react";
import TraversalStep from "./TraversalStep";
import * as cx from "classnames";
import {
  enableShowFullDataFlow,
  disableShowFullDataFlow,
  collapseDomInspector
} from "./actions";
import ItemWithTitle from "./ItemWithTitle";

type TraversalStepsProps = {
  steps?: any[];
  inspectionTarget?: any;
  collapseDomInspector?: boolean;
  showFullDataFlow?: boolean;
  isTraversing?: boolean;
};
let TraversalSteps = class TraversalSteps extends React.Component<
  TraversalStepsProps,
  {}
> {
  render() {
    if (!this.props.inspectionTarget || !this.props.inspectionTarget.logId) {
      return <div>No tracking data available</div>;
    }
    let stepsToShow = [];
    let steps = this.props.steps;
    if (!steps.length) {
      if (this.props.isTraversing) {
        return <div>Loading...</div>;
      } else {
        return null;
      }
    }

    stepsToShow = steps;

    const interestingSteps = [];
    let previousStep = steps[0];
    for (var i = 1; i < steps.length - 1; i++) {
      const step = steps[i];
      const previousStepCriteria = getStepInterestingnessCriteria(previousStep);
      const stepCriteria = getStepInterestingnessCriteria(step);

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
      let str = step.operationLog.result.getTruncatedUIString();

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

    const showOriginStep = steps.length > 1 || !this.props.collapseDomInspector;

    return (
      <div style={{ opacity: this.props.isTraversing ? 0.5 : 1 }}>
        <ItemWithTitle>
          <div>Origin of selected character:</div>
          <div>
            {showOriginStep && (
              <TraversalStep
                key={steps[steps.length - 1].operationLog.index}
                step={steps[steps.length - 1]}
              />
            )}
            {!showOriginStep && (
              <div style={{ opacity: 0.5 }}>
                (same as above, only one step is available)
              </div>
            )}
          </div>
        </ItemWithTitle>

        <div
          className={cx("named-step-container", {
            "named-step-container--collapsed": !this.props.collapseDomInspector
          })}
        >
          <div className="title">
            Inspected JS string
            {this.props.collapseDomInspector
              ? " (click a character to view its origin)"
              : ""}:
            {!this.props.collapseDomInspector && (
              <button
                style={{ marginLeft: 10, cursor: "pointer" }}
                onClick={() => collapseDomInspector()}
              >
                Click to show
              </button>
            )}
          </div>
          {this.props.collapseDomInspector && (
            <TraversalStep key={steps[0].operationLog.index} step={steps[0]} />
          )}
        </div>
        {/* <hr />
        <hr />
        <div>Relevant code:</div>
        {interestingSteps.map(step => (
          <TraversalStep key={step.operationLog.index} step={step} />
        ))
        } */}
        <div style={{ height: 10 }} />
        {this.props.showFullDataFlow && (
          <div
            className="title"
            style={{
              cursor: "pointer"
            }}
            onClick={() => disableShowFullDataFlow()}
          >
            Full data flow – the story of how the inspected string was
            constructed:
          </div>
        )}
        {!this.props.showFullDataFlow && (
          <button
            onClick={() => enableShowFullDataFlow()}
            style={{
              fontSize: 14,
              cursor: "pointer"
            }}
          >
            Show full data flow ({steps.length} steps)
          </button>
        )}
        {this.props.showFullDataFlow &&
          stepsToShow
            .map(step => (
              <div style={{ marginBottom: 10 }}>
                <TraversalStep key={step.operationLog.index} step={step} />
              </div>
            ))
            .reverse()}
      </div>
    );
  }
};

TraversalSteps = branch(
  {
    debugMode: ["debugMode"],
    steps: ["steps"],
    inspectionTarget: ["inspectionTarget"],
    collapseDomInspector: ["collapseDomInspector"],
    showFullDataFlow: ["showFullDataFlow"],
    isTraversing: ["hasInProgressRequest", "traverse"]
  },
  TraversalSteps
);

export default TraversalSteps;

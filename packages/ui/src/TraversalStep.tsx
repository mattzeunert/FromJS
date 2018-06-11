import * as React from "react";
import { branch, root } from "baobab-react/higher-order";
import OperationLogTreeView from "./OperationLogTreeView";
import { resolveStackFrame } from "./api";
import appState from "./appState";
import { TextEl } from "./TextEl";
import Code from "./Code";

function getFileNameFromPath(path) {
  const parts = path.split("/");
  return parts[parts.length - 1];
}

type TraversalStepProps = {
  step: any;
  debugMode?: boolean;
};
type TraversalStepState = {
  stackFrame: any;
  showLogJson: boolean;
  showTree: boolean;
  isExpanded: boolean;
};

let TraversalStep = class TraversalStep extends React.Component<
  TraversalStepProps,
  TraversalStepState
> {
  constructor(props) {
    super(props);
    this.state = {
      stackFrame: null,
      showLogJson: false,
      showTree: false,
      isExpanded: false
    };

    const { step } = props;
    resolveStackFrame(step.operationLog)
      .then(r => {
        // console.log("got stackframe", r);
        this.setState({
          stackFrame: r
        });
        // console.log("done resolve stack frame", r);
        // document.querySelector("#step-code-" + i).innerHTML =
        //   r.code.line.text;
      })
      .catch(err => "yolo");
  }
  render() {
    const { step, debugMode } = this.props;
    const { charIndex, operationLog } = step;
    const { showTree, showLogJson, stackFrame, isExpanded } = this.state;
    let code;
    let fileName, columnNumber, lineNumber;
    let previousLine, nextLine;

    try {
      const { previousLines, nextLines } = stackFrame.code;
      code = stackFrame.code.line.text;
      fileName = stackFrame.fileName.replace("?dontprocess", "");
      lineNumber = stackFrame.lineNumber;
      columnNumber = stackFrame.columnNumber;
      if (previousLines.length > 0) {
        previousLine = previousLines[previousLines.length - 1].text;
      }
      if (nextLines.length > 0) {
        nextLine = nextLines[0].text;
      }
    } catch (err) {
      code = "Loading or error...";
      fileName = "(error)";
    }

    function prepareText(text) {
      if (text.length < 50) {
        return text;
      }
      return text.slice(0, 15) + "..." + text.slice(-30);
    }

    const str = operationLog.result.str;
    // const beforeChar = prepareText(str.slice(0, charIndex));
    // const char = str.slice(charIndex, charIndex + 1);
    // const afterChar = prepareText(str.slice(charIndex + 1));

    let operationTypeDetail = null;
    if (operationLog.operation === "identifier" && stackFrame && code) {
      if (!operationLog.loc) {
        console.log(
          "operation doesn't have loc might need to add in visitor",
          operationLog
        );
      } else {
        operationTypeDetail = code.slice(
          operationLog.loc.start.column,
          operationLog.loc.end.column
        );
      }
    } else if (operationLog.operation === "callExpression") {
      const knownValue = operationLog.args.function.result.knownValue;
      if (knownValue) {
        operationTypeDetail = knownValue;
      }
    } else if (operationLog.operation === "memberExpression") {
      const knownValue = operationLog.args.object.result.knownValue;
      if (knownValue) {
        operationTypeDetail = knownValue + "[...]";
      }
    }
    if (operationTypeDetail) {
      operationTypeDetail = "(" + operationTypeDetail + ")";
    }

    return (
      <div className="step">
        <div className="step__header">
          <div className="step__operation-type">
            {operationLog.operation[0].toUpperCase() +
              operationLog.operation.slice(1)}{" "}
            {operationTypeDetail}
          </div>
          <span style={{ fontSize: "12px", marginTop: 3, float: "left" }}>
            {getFileNameFromPath(fileName)}
          </span>
          <button
            style={{ float: "right" }}
            onClick={() => this.setState({ isExpanded: !isExpanded })}
          >
            {isExpanded ? "-" : "+"}
          </button>
        </div>
        <div className="step__body">
          {debugMode && fileName + ":" + lineNumber + ":" + columnNumber}
          {debugMode && (
            <button
              onClick={() => this.setState({ showLogJson: !showLogJson })}
            >
              toggle show log json
            </button>
          )}
          {showLogJson && <pre>{JSON.stringify(operationLog, null, 4)}</pre>}

          {/* <div className="code-container">
            {isExpanded && (
              <code style={{ display: "block" }}>{previousLine}</code>
            )}
            <code>{code}</code>
            {isExpanded && <code style={{ display: "block" }}>{nextLine}</code>}
          </div> */}
          {/* <div className="step__string">
            <span>{beforeChar}</span>
            <span style={{ color: "#dc1045" }}>{char}</span>
            <span>{afterChar}</span>
          </div> */}

          {this.state.stackFrame && (
            <Code
              resolvedStackFrame={this.state.stackFrame}
              traversalStep={step}
            />
          )}
          <div style={{ borderTop: "1px dotted rgb(221, 221, 221)" }}>
            <TextEl
              text={str}
              highlightedCharacterIndex={charIndex}
              onCharacterClick={charIndex =>
                appState.set(["inspectionTarget", "charIndex"], charIndex)
              }
            />
          </div>
          <div>
            {isExpanded && (
              <button
                style={{ float: "right" }}
                onClick={() => this.setState({ showTree: !showTree })}
              >
                Show Tree
              </button>
            )}
          </div>
          {showTree && <OperationLogTreeView operationLog={operationLog} />}
        </div>
      </div>
    );
  }
};

TraversalStep = branch(
  {
    debugMode: ["debugMode"]
  },
  TraversalStep
);

export default TraversalStep;

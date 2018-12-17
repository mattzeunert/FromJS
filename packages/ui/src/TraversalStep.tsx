import * as React from "react";
import { branch, root } from "baobab-react/higher-order";
import OperationLogTreeView from "./OperationLogTreeView";
import { resolveStackFrame } from "./api";
import appState from "./appState";
import { TextEl } from "./TextEl";
import Code from "./Code";
import { truncate } from "lodash";
import { selectAndTraverse } from "./actions";
import * as cx from "classnames";
import "./TraversalStep.scss";
import OperationLog from "../../core/src/helperFunctions/OperationLog";

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
  isHovering: boolean;
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
      isExpanded: false,
      isHovering: false
    };

    const { step } = props;
    if (this.needsToLoadLocation(step.operationLog)) {
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
  }

  needsToLoadLocation(operationLog) {
    return operationLog.operation !== "initialPageHtml";
  }

  getAllArgs() {
    const operationLog = this.props.step.operationLog;
    const allArgs = [];
    Object.entries(operationLog.args).forEach(([name, value]) => {
      allArgs.push({ name, value });
    });
    Object.entries(operationLog.extraArgs || {}).forEach(([name, value]) => {
      allArgs.push({ name, value });
    });
    return allArgs;
  }

  render() {
    const { step, debugMode } = this.props;
    const { charIndex, operationLog } = step;
    const { showTree, showLogJson, stackFrame } = this.state;
    let { isExpanded } = this.state;
    let code;
    let fileName, columnNumber, lineNumber;
    let previousLine, nextLine;

    if (operationLog.result.type === "object") {
      // the user probably cares about the arguments
      isExpanded = true;
    }

    let hasResolvedFrame = false;
    if (this.needsToLoadLocation(operationLog)) {
      try {
        if (stackFrame) {
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
          hasResolvedFrame = true;
        } else {
          code = "(Loading...)";
          fileName = "(Loading...)";
        }
      } catch (err) {
        code = "(error)";
        fileName = "(error)";
      }
    } else {
      code = "";
      fileName = operationLog.runtimeArgs.url;
    }

    function prepareText(text) {
      if (text.length < 50) {
        return text;
      }
      return text.slice(0, 15) + "..." + text.slice(-30);
    }

    const str = operationLog.result.primitive + "";
    // const beforeChar = prepareText(str.slice(0, charIndex));
    // const char = str.slice(charIndex, charIndex + 1);
    // const afterChar = prepareText(str.slice(charIndex + 1));

    let operationTypeDetail = null;
    try {
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

        const knownTypes = operationLog.args.object.result.knownTypes || [];
        if (knownTypes.includes("HTMLInputElement")) {
          operationTypeDetail =
            "HTMLInputElement." + operationLog.args.propName.result.primitive;
        }
      } else if (operationLog.operation === "fetchResponse") {
        operationTypeDetail = operationLog.runtimeArgs.url;
      }
    } catch (err) {
      console.log(err);
    }

    let shortFileName = getFileNameFromPath(fileName);
    if (shortFileName.length === 0) {
      // Commonly happens for HTML path that ends with /
      shortFileName = fileName;
    }
    const fileNameLabel = this.state.isHovering ? fileName : shortFileName;
    return (
      <div
        className="step"
        onMouseEnter={() => this.setState({ isHovering: true })}
        onMouseLeave={() => this.setState({ isHovering: false })}
      >
        <div className="step__header">
          <div className="step__operation-type">
            {operationLog.operation[0].toUpperCase() +
              operationLog.operation.slice(1)}{" "}
            <span className="step__operation-type-detail">
              {operationTypeDetail}
            </span>
          </div>
          <span style={{ fontSize: "12px", marginTop: 3, float: "left" }}>
            {hasResolvedFrame ? (
              <a
                target="_blank"
                href={"/viewFullCode/" + encodeURIComponent(fileName)}
              >
                {fileNameLabel}
              </a>
            ) : (
              fileNameLabel
            )}
          </span>
          <button
            className="blue-button"
            style={{ float: "right" }}
            onClick={() => this.setState({ isExpanded: !isExpanded })}
          >
            {isExpanded ? "Hide arguments" : "Arguments"}
          </button>
        </div>
        <div className="step__body">
          {debugMode && fileName + ":" + lineNumber + ":" + columnNumber}
          {debugMode && (
            <button
              onClick={() => {
                window["logJson"] = operationLog;
                this.setState({ showLogJson: !showLogJson });
              }}
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

          {isExpanded && (
            <div className="step__arguments">
              <div className="step__arguments__title">
                Inspect input/output values:
              </div>
              {/* <pre>
                Runtime args:
                {JSON.stringify(
                  this.props.step.operationLog.runtimeArgs,
                  null,
                  4
                )}
              </pre> */}
              {this.getAllArgs().length === 0 && <div>(No arguments)</div>}
              {this.getAllArgs().map(({ name, value }) => {
                value = value && new OperationLog(value);
                const canInspect = !!value;
                return (
                  <div
                    className={cx("step__argument", {
                      "step__argument--can-inspect": canInspect
                    })}
                    onClick={() => {
                      if (!canInspect) {
                        return;
                      }
                      selectAndTraverse(value.index, 0, "traversalStep");
                    }}
                  >
                    <span style={{ color: "#b91212" }}>{name}:</span>
                    &nbsp;
                    <span>
                      {value
                        ? truncate(value.result.getTruncatedUIString(), {
                            length: 80
                          })
                        : "(no tracking value)"}
                    </span>
                  </div>
                );
              })}
              {debugMode && (
                <div>
                  <button
                    style={{ float: "right" }}
                    onClick={() => this.setState({ showTree: !showTree })}
                  >
                    Show Tree
                  </button>
                </div>
              )}
            </div>
          )}

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
                selectAndTraverse(
                  operationLog.index,
                  charIndex,
                  "traversalStep"
                )
              }
            />
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

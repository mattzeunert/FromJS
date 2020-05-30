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
import { adjustColumnForEscapeSequences } from "../../core/src/adjustColumnForEscapeSequences";

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
      isHovering: false,
    };

    const { step } = props;
    if (this.needsToLoadLocation(step.operationLog)) {
      resolveStackFrame(step.operationLog)
        .then((r) => {
          // console.log("got stackframe", r);
          this.setState({
            stackFrame: r,
          });
          // console.log("done resolve stack frame", r);
          // document.querySelector("#step-code-" + i).innerHTML =
          //   r.code.line.text;
        })
        .catch((err) => "yolo");
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

    // if (operationLog.result.type === "object") {
    //   // the user probably cares about the arguments
    //   isExpanded = true;
    // }

    let hasResolvedFrame = false;
    if (this.needsToLoadLocation(operationLog)) {
      try {
        if (stackFrame) {
          if (stackFrame.file && stackFrame.file.nodePath) {
            fileName = stackFrame.file.nodePath.split("/").slice(-2).join("/");
          } else {
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
          }
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

    let str = operationLog.result.primitive + "";

    if (!operationLog.result.primitive) {
      str = operationLog.result.getTruncatedUIString();
    }
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
        if (
          (knownValue === "Function.prototype.call" ||
            knownValue === "Function.prototype.apply") &&
          operationLog.args.context.result.knownValue
        ) {
          operationTypeDetail = operationLog.args.context.result.knownValue;
        } else if (knownValue) {
          operationTypeDetail = knownValue;
        }
      } else if (operationLog.operation === "memberExpression") {
        const knownValue = operationLog.args.object.result.knownValue;
        if (knownValue) {
          operationTypeDetail = knownValue;
          const propName = operationLog.args.propName.result.primitive;
          if (propName.length > 20 || propName.includes(".")) {
            operationTypeDetail +=
              '["' +
              truncate(propName, {
                length: 20,
              }) +
              '"]';
          } else {
            operationTypeDetail += "." + propName;
          }
        } else if (operationLog.opeartion === "emptyTrackingInfo") {
          operationTypeDetail = operationLog.runtimeArgs.type;
        }

        const knownTypes = operationLog.args.object.result.knownTypes || [];
        if (knownTypes.includes("HTMLInputElement")) {
          operationTypeDetail =
            "HTMLInputElement." + operationLog.args.propName.result.primitive;
        }
        if (knownTypes.includes("WebSocketMessage")) {
          operationTypeDetail =
            "WebSocketMessage." + operationLog.args.propName.result.primitive;
        }
      } else if (operationLog.operation === "fetchResponse") {
        operationTypeDetail = operationLog.runtimeArgs.url;
      } else if (operationLog.operation === "XMLHttpRequest.responseText") {
        operationTypeDetail = operationLog.runtimeArgs.url;
      } else if (operationLog.operation === "readFileSyncResult") {
        operationTypeDetail = operationLog.runtimeArgs.filePath
          .split("/")
          .slice(-1)[0];
      } else if (operationLog.operation === "fileContent") {
        operationTypeDetail = operationLog.runtimeArgs.path;
      }
    } catch (err) {
      console.log(err);
    }

    let highlighNthCharAfterColumn = null;
    if (
      this.state.stackFrame &&
      step.operationLog.operation === "stringLiteral"
    ) {
      highlighNthCharAfterColumn = adjustColumnForEscapeSequences(
        this.state.stackFrame.code.line.text,
        step.charIndex + "'".length
      );
    }

    let shortFileName = getFileNameFromPath(fileName);
    if (shortFileName.length === 0) {
      // Commonly happens for HTML path that ends with /
      shortFileName = fileName;
    }
    let fullFileNameForDisplay = fileName.replace(
      "http://fromjs-temporary-url.com:5555/",
      ""
    );
    const fileNameLabel = shortFileName;

    let opNameToShow =
      operationLog.operation[0].toUpperCase() + operationLog.operation.slice(1);
    if (operationLog.operation === "genericOperation") {
      opNameToShow = operationLog.runtimeArgs.name;
    }

    return (
      <div
        className="step"
        onMouseEnter={() => this.setState({ isHovering: true })}
        onMouseLeave={() => this.setState({ isHovering: false })}
      >
        <div className="step__header">
          <div className="step__operation-type">
            {opNameToShow}{" "}
            <span className="step__operation-type-detail">
              {operationTypeDetail}
            </span>
          </div>
          <span style={{ fontSize: "12px", marginTop: 2 }}>
            {hasResolvedFrame ? (
              <a
                target="_blank"
                href={
                  "/viewFullCode/" +
                  encodeURIComponent(fileName.replace(" (prettified)", ""))
                }
              >
                {fileNameLabel}
              </a>
            ) : (
              fileNameLabel
            )}
          </span>
          <div style={{ flexGrow: 1, textAlign: "right" }}>
            <button
              data-test-arguments-button
              className="blue-button"
              style={{ height: 21 }}
              onClick={() => {
                console.log("Click expand arguments");
                this.setState({ isExpanded: !isExpanded });
              }}
            >
              {isExpanded ? "Hide" : "Details"}
            </button>
          </div>
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
              <div data-test-argument={name} className={"step__argument"}>
                <span className="step__argument-name">Filename:</span>{" "}
                {fullFileNameForDisplay}
              </div>
              <div
                style={{ paddingLeft: 6, marginTop: 5 }}
                className="step__arguments__title"
              >
                Inspect operation arguments:
              </div>
              <pre>
                Runtime args:
                {JSON.stringify(
                  this.props.step.operationLog.runtimeArgs,
                  null,
                  4
                )}
              </pre>
              {this.getAllArgs().length === 0 && (
                <div style={{ padding: 6 }}>(No arguments)</div>
              )}
              {this.getAllArgs().map(({ name, value }) => {
                value = value && new OperationLog(value);

                if (
                  value &&
                  value.operation === "callExpression" &&
                  value.args.function.result.knownValue === "fetch"
                ) {
                  // show user the URL right away since that saves them one click
                  value = value.args.arg0;
                  name = "URL";
                }

                if (
                  value &&
                  value.operation === "callExpression" &&
                  value.args.function.result.knownValue ===
                    "XMLHttpRequest.prototype.open"
                ) {
                  // show user the URL right away since that saves them one click
                  value = value.args.arg1;
                  name = "URL";
                }

                const canInspect = !!value;

                return (
                  <div
                    data-test-argument={name}
                    className={cx("step__argument", {
                      "step__argument--can-inspect": canInspect,
                    })}
                    onClick={() => {
                      if (!canInspect) {
                        return;
                      }
                      selectAndTraverse(value.index, 0, "traversalStep");
                    }}
                  >
                    <span className="step__argument-name">{name}:</span>
                    &nbsp;
                    <span>
                      {value
                        ? truncate(value.result.getTruncatedUIString(), {
                            length: 80,
                          })
                        : "(no tracking value)"}
                    </span>
                  </div>
                );
              })}
              {operationLog.astArgs &&
                Object.keys(operationLog.astArgs).length > 0 && (
                  <div style={{ padding: 6 }}>
                    <div className="step__arguments__title">AST info:</div>
                    {Object.entries(operationLog.astArgs).map(
                      ([key, value]) => {
                        return (
                          <div>
                            {key}: {value}
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              {/* {operationLog.runtimeArgs &&
                Object.keys(operationLog.runtimeArgs).length > 0 && (
                  <div>
                    <div
                      className="step__arguments__title"
                      style={{ paddingLeft: 6 }}
                    >
                      Runtime arguments:
                    </div>
                    {Object.keys(operationLog.runtimeArgs).map(key => {
                      const value = operationLog.runtimeArgs[key];
                      return (
                        <div
                          data-test-argument={name}
                          className={"step__argument"}
                        >
                          <span className="step__argument-name">{key}:</span>{" "}
                          {value}
                        </div>
                      );
                    })}
                  </div>
                )} */}

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
              highlighNthCharAfterColumn={highlighNthCharAfterColumn}
            />
          )}
          <div style={{ borderTop: "1px dotted rgb(221, 221, 221)" }}>
            <TextEl
              text={str}
              highlightedCharacterIndex={charIndex}
              onCharacterClick={(charIndex) =>
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
    debugMode: ["debugMode"],
  },
  TraversalStep
);

export default TraversalStep;

import * as React from "react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { loadSteps, makeFEOperationLog } from "./api";
import { selectAndTraverse } from "./actions";
import TraversalStep from "./TraversalStep";

console.log("kkkkkkkssssskkkk");

// monaco.languages.registerHoverProvider("javascript", {
//   provideHover: function(model, position) {
//     let ret: monaco.languages.Hover;

//     // if (position.lineNumber == 3) {
//     //   ret = {
//     //     range: new monaco.Range(1, 1, 1, 4),
//     //     contents: [{ value: "a" }, { value: "b" }]
//     //   };
//     // }
//     return ret!; // the ! tells the typescript compiler to shut up
//   }
// });

function getCodeString(loc) {
  const lines = window["fileContent"].split("\n");
  if (loc.value.start.line !== loc.value.end.line) {
    return "todo";
  }
  return lines[loc.value.start.line - 1].slice(
    loc.value.start.column,
    loc.value.end.column
  );
}

export class App2 extends React.Component {
  state = { info: [], files: [] };

  async componentDidMount() {
    this.setState({
      files: await fetch("/xyzviewer/fileInfo").then(r => r.json())
    });
  }

  render() {
    window["setLocs"] = async locs => {
      const r = await Promise.all(
        locs.map(loc => {
          return fetch("/xyzviewer/trackingDataForLoc/" + loc.key)
            .then(r => r.json())
            .then(res => {
              return {
                logs: res,
                loc: loc
              };
            });
        })
      );
      this.setState({ info: r });
    };
    console.log({ monaco });

    return (
      <div>
        {this.state.files
          // rough filter for now
          .filter(
            f =>
              f.url.includes(".js") &&
              !f.url.includes(".json") &&
              !f.url.includes("compileInBrowser.js") &&
              !f.url.includes("babel-standalone.js")
          )
          .map(f => {
            return (
              <div
                onClick={() => {
                  fetch("/xyzviewer/fileDetails/" + f.key)
                    .then(r => r.json())
                    .then(r => {
                      if (window["editor"]) {
                        window["editor"].dispose();
                      }
                      window["editor"] = monaco.editor.create(
                        document.getElementById("container"),
                        {
                          value: r["fileContent"],
                          language: "javascript",
                          readOnly: true
                        }
                      );
                      window["editor"].onDidChangeCursorPosition(function({
                        position
                      }) {
                        console.log(position.lineNumber);

                        let matchingLocs = window["locs"].filter(l => {
                          return (
                            l.value.start.line <= position.lineNumber &&
                            l.value.end.line >= position.lineNumber &&
                            (l.value.start.line !== l.value.end.line ||
                              (l.value.start.column <= position.column &&
                                l.value.end.column >= position.column))
                          );
                        });
                        // debugger;

                        window.setLocs(matchingLocs);
                        console.log(matchingLocs);
                      });

                      window["locs"] = r.locs;
                      window["fileContent"] = r.fileContent;

                      let d = [];
                      window["locs"].forEach(loc => {
                        if (loc.value.start.line !== loc.value.end.line) {
                          console.log("ignoring multiline loc for now");
                          d.push({
                            range: new monaco.Range(
                              loc.value.start.line,
                              loc.value.start.column,
                              loc.value.start.line,
                              loc.value.start.column + 2
                            ),
                            options: {
                              isWholeLine: false,
                              inlineClassName:
                                "myInlineDecoration-multiline-start"
                            }
                          });
                          return;
                        }
                        d.push(
                          {
                            range: new monaco.Range(
                              loc.value.start.line,
                              loc.value.start.column,
                              loc.value.end.line,
                              loc.value.end.column
                            ),
                            options: {
                              isWholeLine: false,
                              inlineClassName:
                                loc.logCount > 0
                                  ? loc.logCount > 5
                                    ? "myInlineDecoration-hasMany"
                                    : "myInlineDecoration-has"
                                  : "myInlineDecoration-none"
                              // linesDecorationsClassName: "myLineDecoration"
                            }
                          }
                          // {
                          //   range: new monaco.Range(7, 1, 7, 24),
                          //   options: { inlineClassName: "myInlineDecoration" }
                          // }
                        );
                      });
                      console.log(d);

                      var decorations = window["editor"].deltaDecorations(
                        [],
                        d
                      );
                    });
                }}
              >
                {f.url}
              </div>
            );
          })}

        <hr />
        {this.state.info.map(info => {
          return <InfoItem info={info}></InfoItem>;
        })}
      </div>
    );
  }
}

class InfoItem extends React.Component {
  state = {
    showJson: false,
    showUsesFor: null
  };
  render() {
    let { info } = this.props;
    return (
      <div>
        <h2>{getCodeString(info.loc)}</h2>
        Values:{" "}
        {info.logs.map(l => (
          <div>
            <code
              onClick={() => {
                selectAndTraverse(l.value.index, 0);
                if (l.value._result && l.value._result.type === "function") {
                  loadSteps({ logId: l.value.index, charIndex: 0 }).then(
                    ({ steps }) => {
                      const lastStep = steps[steps.length - 1];
                      console.log({ steps });
                      this.setState({
                        showUsesFor: lastStep.operationLog.index
                      });
                    }
                  );
                }
              }}
            >
              {JSON.stringify(l.value._result)}{" "}
            </code>
          </div>
        ))}
        <hr />
        <button
          onClick={() => this.setState({ showJson: !this.state.showJson })}
        >
          toggle json
        </button>
        {this.state.showJson && <pre>{JSON.stringify(info.logs, null, 2)}</pre>}
        {this.state.showUsesFor && (
          <ShowUses
            logIndex={this.state.showUsesFor}
            key={this.state.showUsesFor}
          ></ShowUses>
        )}
      </div>
    );
  }
}

class ShowUses extends React.Component {
  state = {
    uses: []
  };
  async componentDidMount() {
    this.setState({
      uses: await fetch(
        "/xyzviewer/getUses/" +
          this.props.logIndex +
          "?operationFilter=callExpression"
      ).then(r => r.json())
    });
  }
  render() {
    return (
      <div>
        {this.state.uses.map(use => {
          return (
            <div>
              <b>{use.operation}</b>
              <TraversalStep
                // makeFEOoperationLog normally done in api.ts
                step={{ operationLog: makeFEOperationLog(use), charIndex: 0 }}
              ></TraversalStep>
            </div>
          );
        })}
      </div>
    );
  }
}

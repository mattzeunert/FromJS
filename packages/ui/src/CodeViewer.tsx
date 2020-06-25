import * as React from "react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { loadSteps, makeFEOperationLog } from "./api";
import { selectAndTraverse } from "./actions";
import TraversalStep from "./TraversalStep";
import { ErrorBoundary } from "./ErrorBoundary";

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
  if (loc.start.line !== loc.end.line) {
    return "todo";
  }
  let line = lines[loc.start.line - 1];
  if (!line) {
    console.log("failed to get code string");
    return "";
  }
  return line.slice(loc.start.column, loc.end.column);
}

export class App2 extends React.Component {
  state = { info: [], files: [] };

  async componentDidMount() {
    this.setState({
      files: await fetch("/xyzviewer/fileInfo").then((r) => r.json()),
    });
  }

  render() {
    window["setLocs"] = async (locs) => {
      const r = await Promise.all(
        locs.map((loc) => {
          return fetch("/xyzviewer/trackingDataForLoc/" + loc.key)
            .then((r) => r.json())
            .then((res) => {
              return {
                logs: res,
                loc: loc,
              };
            });
        })
      );
      this._random = Math.random();
      this.setState({ info: r });
    };
    console.log({ monaco, r: this._random });

    const { App } = this.props;

    function selectFile(f) {}

    console.log(this.props);

    return (
      <div style={{ display: "flex" }}>
        <div>
          <div style={{ height: "40vh", overflow: "auto" }}>
            <FileSelector
              files={this.state.files}
              fileSearch={this.props.fileSearch}
              selectFile={(f) =>
                this.props.setQueryParam("selectedFile", f.fileKey)
              }
              updateFileSearch={(value) => {
                this.props.setQueryParam("fileSearch", value);
              }}
            ></FileSelector>
          </div>
          <FileView
            fileKey={this.props.selectedFile}
            key={this.props.selectedFile}
          ></FileView>
        </div>

        <div
          style={{
            flexGrow: 1,
            width: "30vw",
            overflow: "auto",
            height: "95vh",
          }}
        >
          {this.state.info.map((info, i) => {
            return (
              <InfoItem info={info} key={this._random + "_" + i}></InfoItem>
            );
          })}
        </div>

        <div style={{ flexGrow: 1, width: "30vw" }}>
          <App></App>
        </div>
      </div>
    );
  }
}

class FileView extends React.Component {
  state = {
    loadingFile: true,
  };
  componentDidMount() {
    fetch("/xyzviewer/fileDetails/" + this.props.fileKey)
      .then((r) => r.json())
      .then(async (r) => {
        this.setState({ loadingFile: false });
        if (window["editor"]) {
          window["editor"].dispose();
        }
        window["editor"] = monaco.editor.create(
          document.getElementById("container"),
          {
            value: r["fileContent"],
            language: "javascript",
            readOnly: true,
          }
        );
        window["editor"].onDidChangeCursorPosition(function ({ position }) {
          console.log(position.lineNumber);
          let matchingLocs = window["locs"].filter((l) => {
            return (
              l.start.line <= position.lineNumber &&
              l.end.line >= position.lineNumber &&
              (l.start.line !== l.end.line ||
                (l.start.column <= position.column &&
                  l.end.column >= position.column))
            );
          });
          // debugger;
          window.setLocs(matchingLocs);
          console.log(matchingLocs);
        });
        window["locs"] = r.locs.filter((l) => l.start && l.end);
        window["fileContent"] = r.fileContent;
        let d = [];
        window["locs"].forEach((loc) => {
          if (loc.start.line !== loc.end.line) {
            console.log("ignoring multiline loc for now");
            d.push({
              range: new monaco.Range(
                loc.start.line,
                loc.start.column,
                loc.start.line,
                loc.start.column + 2
              ),
              options: {
                isWholeLine: false,
                inlineClassName: "myInlineDecoration-multiline-start",
              },
            });
            return;
          }
          d.push(
            {
              range: new monaco.Range(
                loc.start.line,
                loc.start.column + 1,
                loc.end.line,
                loc.end.column + 1
              ),
              options: {
                isWholeLine: false,
                inlineClassName:
                  loc.logCount > 0
                    ? loc.logCount > 5
                      ? "myInlineDecoration-hasMany"
                      : "myInlineDecoration-has"
                    : "myInlineDecoration-none",
                // linesDecorationsClassName: "myLineDecoration"
              },
            }
            // {
            //   range: new monaco.Range(7, 1, 7, 24),
            //   options: { inlineClassName: "myInlineDecoration" }
            // }
          );
        });
        console.log(d);
        var decorations = window["editor"].deltaDecorations([], d);
      });
  }

  render() {
    return (
      <div>
        {this.state.loadingFile && <div>Loading...</div>}
        <div
          id="container"
          style={{
            width: 800,
            height: "55vh",
            border: "1px solid grey",
          }}
        ></div>
      </div>
    );
  }
}

class FileSelector extends React.Component {
  render() {
    return (
      <div>
        <input
          type="text"
          onChange={(e) => this.props.updateFileSearch(e.target.value)}
          value={this.props.fileSearch}
        ></input>
        {this.props.files
          // rough filter for now
          .filter(
            (f) =>
              f.url.includes(".js") &&
              !f.url.includes(".json") &&
              !f.url.includes("compileInBrowser.js") &&
              !f.url.includes("babel-standalone.js")
          )
          .filter((f) => {
            if (!this.props.fileSearch) {
              return true;
            }
            return (f.url + f.nodePath)
              .toLowerCase()
              .includes(this.props.fileSearch.toLowerCase());
          })
          .map((f) => {
            return (
              <div
                onClick={() => {
                  this.props.selectFile(f);
                }}
              >
                {f.nodePath || f.url}{" "}
                <span style={{ fontSize: 12, color: "#777" }}>
                  {new Date(f.createdAt).toLocaleString()}
                </span>
              </div>
            );
          })}
      </div>
    );
  }
}

class InfoItem extends React.Component {
  state = {
    showJson: false,
    showUsesFor: null,
  };
  render() {
    let { info } = this.props;
    return (
      <div>
        <h2>{getCodeString(info.loc)}</h2>
        Values:{" "}
        {info.logs.map((l) => (
          <div>
            <code
              onClick={() => {
                selectAndTraverse(l.value.index, 0);

                loadSteps({ logId: l.value.index, charIndex: 0 }).then(
                  ({ steps }) => {
                    const lastStep = steps[steps.length - 1];
                    console.log({ steps });
                    this.setState({
                      showUsesFor: lastStep.operationLog.index,
                    });
                  }
                );
              }}
            >
              {JSON.stringify(l.value._result).slice(0, 2000)}{" "}
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
        {JSON.stringify(this.state)}
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
    uses: null,
  };
  async componentDidMount() {
    this.setState({
      uses: await fetch("/xyzviewer/getUses/" + this.props.logIndex).then((r) =>
        r.json()
      ),
    });
  }
  render() {
    if (!this.state.uses) {
      return <div></div>;
    }
    return (
      <div>
        {this.state.uses.length === 0 && <div>No uses found.</div>}
        {this.state.uses
          .filter((u) => u.argName === "function")
          .map(({ use, argName }) => {
            return (
              <div>
                <b>{use.operation}</b> (as {argName})
                <ErrorBoundary>
                  {" "}
                  <TraversalStep
                    // makeFEOoperationLog normally done in api.ts
                    step={{
                      operationLog: makeFEOperationLog(use),
                      charIndex: 0,
                    }}
                  ></TraversalStep>
                </ErrorBoundary>
              </div>
            );
          })}
      </div>
    );
  }
}

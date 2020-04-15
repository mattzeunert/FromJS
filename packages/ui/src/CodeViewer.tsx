import * as React from "react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { loadSteps } from "./api";
import { selectAndTraverse } from "./actions";

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
        {this.state.files.map(f => {
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
                          l.value.start.line >= position.lineNumber &&
                          l.value.end.line <= position.lineNumber &&
                          (l.value.start.line !== l.value.end.line ||
                            (l.value.start.column <= position.column &&
                              l.value.end.column >= position.column))
                        );
                      });

                      window.setLocs(matchingLocs);
                      console.log(matchingLocs);
                    });

                    window["locs"] = r.locs;
                    window["fileContent"] = r.fileContent;

                    let d = [];
                    window["locs"].forEach(loc => {
                      if (loc.value.start.line !== loc.value.end.line) {
                        console.log("ignoring multiline loc for now");
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
                            inlineClassName: "myInlineDecoration"
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

                    var decorations = window["editor"].deltaDecorations([], d);
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
    showJson: false
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
      </div>
    );
  }
}

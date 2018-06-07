// import { InMemoryLogServer, operations, babelPlugin } from "@fromjs/core";
// importing @fromjs/core only works in a node environment because it loads babel
// so import files directly here
// import InMemoryLogServer from "../../core/src/InMemoryLogServer";
import operations from "../../core/src/operations";
import babelPlugin from "../../core/src/babelPlugin";
import * as React from "react";
import * as ReactDom from "react-dom";
import OperationLog from "../../core/src/helperFunctions/OperationLog";
const traverse = x => null;
import { escape } from "lodash";
import { TextEl } from "./TextEl";
import Code from "./Code";
import TraversalSteps from "./TraversalSteps";
import appState from "./appState";
// import Babel from "@babel/standalone";
// document.write("hi");
import { callApi } from "./api";

import "./main.scss";

import * as Baobab from "baobab";
import { branch, root } from "baobab-react/higher-order";
import DomInspector from "./DomInspector";

let backendRoot = "http://localhost:" + window["backendPort"];

appState.select("inspectionTarget").on("update", ({ target }) => {
  const inspectionTarget = target.get();
  if (!inspectionTarget || inspectionTarget.logId === null) {
    console.log("no inspection target!!");
  } else {
    showSteps(inspectionTarget.logId, inspectionTarget.charIndex);
  }
});

const DEBUG = true;

var exampleSocket = new WebSocket("ws://127.0.0.1:" + window["backendPort"]);

exampleSocket.onmessage = function(event) {
  console.log("websocket onmessage", event.data);
  const message = JSON.parse(event.data);
  if (message.type === "inspectOperationLog") {
    appState.set("inspectionTarget", {
      logId: message.operationLogId,
      charIndex: 0
    });
  } else if (message.type === "inspectDOM") {
    console.log("inspectdom", event);
    appState.set("domToInspect", {
      outerHTML: message.html
    });
  }
};

if (DEBUG) {
  document
    .querySelector("#compiled-code")
    .setAttribute("style", "display: block");
}

var editor = window["CodeMirror"].fromTextArea(
  document.getElementById("code"),
  {
    mode: "javascript",
    lineNumbers: true
  }
);
editor.on("change", function(cMirror) {
  // get value right from instance
  codeTextarea.value = cMirror.getValue();
  try {
    chart.setAttribute("style", "opacity: 0.3");
    update();
    chart.setAttribute("style", "opacity: 1");
  } catch (err) {
    console.log(err);
  }
});

fetch(backendRoot + "/inspect", {
  method: "GET",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json"
  }
} as any)
  .then(res => res.json())
  .then(r => {
    const { logToInspect } = r;
    appState.set("inspectionTarget", {
      logId: logToInspect,
      charIndex: 0
    });
  });

let previousDomToInspect = null;

fetch(backendRoot + "/inspectDOM", {
  method: "GET",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json"
  }
})
  .then(res => res.json())
  .then(r => {
    const { html } = r;

    if (html) {
      appState.set("domToInspect", {
        outerHTML: html
      });
    }
  });

const codeTextarea = document.querySelector("#code") as HTMLInputElement;

const compiledCodeTextarea = document.querySelector(
  "#compiled-code"
) as HTMLInputElement;

const chart = document.querySelector(".chart") as HTMLElement;

// update();

function instrumentCode(code) {
  return callApi("instrument", { code });
}

function update() {
  var code = editor.getValue();

  instrumentCode(code)
    .then(({ instrumentedCode }) => {
      let codePromise;

      if (DEBUG) {
        codePromise = callApi("prettify", { code: instrumentedCode }).then(
          r => {
            compiledCodeTextarea.value = r.code.split(
              "/* HELPER_FUNCTIONS_END */ "
            )[1];
            return Promise.resolve(r.code);
          }
        );
      } else {
        codePromise = Promise.resolve(instrumentedCode);
      }
      return codePromise;
    })
    .then(code => runCodeAndshowResult(code));
}

// TODO: don't copy/paste this
function eachArgument(args, arrayArguments, fn) {
  Object.keys(args).forEach(key => {
    if (arrayArguments.includes(key)) {
      args[key].forEach((a, i) => {
        fn(a, "element" + i, newValue => (args[key][i] = newValue));
      });
    } else {
      fn(args[key], key, newValue => (args[key] = newValue));
    }
  });
}

function loadSteps({ logId, charIndex }) {
  return fetch(backendRoot + "/traverse", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    } as any,
    body: JSON.stringify({ logId: logId, charIndex })
  }).then(res => res.json());
}

window["showSteps"] = showSteps;
function showSteps(logId, charIndex) {
  window["updateChar"](charIndex);
  loadSteps({ logId, charIndex }).then(r => {
    var steps = r.steps;
    console.log({ steps });

    appState.set("steps", steps);

    function highlightInTree() {
      document.querySelectorAll("[data-index]").forEach(el => {
        if (el && el.parentElement) {
          el.parentElement.classList.remove("highlight-step");
        }
      });
      steps.forEach(step => {
        var el = document.querySelector(
          "[data-index='" + step.operationLog.index + "']"
        );
        if (el && el.parentElement) {
          el.parentElement.classList.add("highlight-step");
        }
      });
    }
    highlightInTree();

    var html = ``;

    if (Math.random() > 0.000000001) {
      return;
    }

    steps.forEach((step, i) => {
      console.log(step, step.operationLog.stack);

      fetch(backendRoot + "/resolveStackFrame", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        } as any,
        body: JSON.stringify({
          stackFrameString: step.operationLog.stackFrames[0],
          operationLog: step.operationLog
        })
      })
        .then(res => res.json())
        .then(r => {
          console.log("done resolve stack frame", r);
          document.querySelector("#step-code-" + i).innerHTML =
            r.code.line.text;
        });

      var tv = step.operationLog;
      var args = "";
      // eachArgument(tv.args, ["elements"], (arg, argName) => {
      //   args +=
      //     argName +
      //     ": <code>" +
      //     (arg &&
      //       arg.result.str.replace(/</g, "&lt;").replace(/>/g, "&gt;")) +
      //     "</code>";
      // });
      html += `<div>
            ${tv.operation} (char: ${step.charIndex})
            ${tv.result.str.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
            <code id="step-code-${i}"></code>
          </div>`;
    });

    document.querySelector("#steps").innerHTML = html;
  });
}

function runCodeAndshowResult(code) {
  try {
    eval(code);
  } catch (err) {
    console.error(err);
    chart.setAttribute("style", "opacity: 0.3");
    return;
  }

  var inspectedValue = window["inspectedValue"];
  showNormalValue(inspectedValue);

  document.querySelector("#basic-example").innerHTML = "";

  showTree(inspectedValue.tracking);
  appState.set("inspectionTarget", {
    logId: inspectedValue.tracking,
    charIndex: 0
  });
}

// function loadLog(logIndex, fn) {
//   serverInterface.loadLog(logIndex, log => {
//     fn(log.args.value);
//   });
// }

function showNormalValue(inspectedValue) {
  var html =
    "<b>Inspected value:</b><br><div style='margin-top: 5px' id='chars'>";
  var value = inspectedValue.normal;
  for (var i = 0; i < value.length; i++) {
    html += `<span onMouseEnter="showSteps(${inspectedValue.tracking}, ${i})">${
      value[i]
    }</span>`;
  }
  html += "</div>";
  html +=
    "<div style='font-size: 12px; color: #555;margin-top: 10px'>(Hover over each character to see where it originated. Traversing the tree through built-in function calls is tricky, right now only String.prototype.slice is supported.)</div>";
  document.querySelector("#normal-value").innerHTML = html;
}
window["updateChar"] = function(charIndex) {
  try {
    var charEls = document.querySelector("#chars").children;

    Array.from(charEls).forEach(el => el.setAttribute("style", ""));

    charEls[charIndex].setAttribute("style", "color:  #f627c9;");
  } catch (err) {
    console.log(err);
  }
};

function showTree(logIndex) {
  if (window["inspectedValue"].normal === undefined) {
    throw Error("value is undefiend");
  }

  // loadLog(logIndex, log => {
  //   renderTree(log, "#basic-example");
  // });
}

window["showResult"] = update;

function onInspectionTargetChanged() {
  console.log("onInspectionTargetChanged", arguments);
}

let App = () => {
  return (
    <div>
      <button
        onClick={() => appState.set("debugMode", !appState.get("debugMode"))}
      >
        Debug
      </button>
      <DomInspector />
      <TraversalSteps />
    </div>
  );
};

App = root(appState, App);

ReactDom.render(<App />, document.querySelector("#app"));

setTimeout(
  () => appState.set("inspectionTarget", { logId: 705162159, charIndex: 0 }),
  500
);

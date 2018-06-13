// import { InMemoryLogServer, operations, babelPlugin } from "@fromjs/core";
// importing @fromjs/core only works in a node environment because it loads babel
// so import files directly here
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
import * as actions from "./actions";
import { callApi, loadSteps } from "./api";

import * as Baobab from "baobab";
import { branch, root } from "baobab-react/higher-order";
import DomInspector from "./DomInspector";

window["__debugActions"] = actions;

import "./main.scss";

// global function used by tree view html
window["showSteps"] = function(logId, charIndex) {
  actions.selectAndTraverse(logId, charIndex);
};

let App = () => {
  return (
    <div>
      <DomInspector />
      <TraversalSteps />
      <button
        onClick={() => appState.set("debugMode", !appState.get("debugMode"))}
      >
        Debug
      </button>
    </div>
  );
};

App = root(appState, App);

ReactDom.render(<App />, document.querySelector("#app"));

// setTimeout(() => actions.selectAndTraverse(705162159, 0), 500);

// const codeTextarea = document.querySelector("#code") as HTMLInputElement;

// const compiledCodeTextarea = document.querySelector(
//   "#compiled-code"
// ) as HTMLInputElement;

// var editor = window["CodeMirror"].fromTextArea(
//   document.getElementById("code"),
//   {
//     mode: "javascript",
//     lineNumbers: true
//   }
// );
// editor.on("change", function(cMirror) {
//   // get value right from instance
//   codeTextarea.value = cMirror.getValue();
//   try {
//     chart.setAttribute("style", "opacity: 0.3");
//     update();
//     chart.setAttribute("style", "opacity: 1");
//   } catch (err) {
//     console.log(err);
//   }
// });

// update();

// function instrumentCode(code) {
//   return callApi("instrument", { code });
// }

// function update() {
//   var code = editor.getValue();

//   instrumentCode(code)
//     .then(({ instrumentedCode }) => {
//       let codePromise;

//       if (DEBUG) {
//         codePromise = callApi("prettify", { code: instrumentedCode }).then(
//           r => {
//             compiledCodeTextarea.value = r.code.split(
//               "/* HELPER_FUNCTIONS_END */ "
//             )[1];
//             return Promise.resolve(r.code);
//           }
//         );
//       } else {
//         codePromise = Promise.resolve(instrumentedCode);
//       }
//       return codePromise;
//     })
//     .then(code => runCodeAndshowResult(code));
// }

// TODO: don't copy/paste this
// function eachArgument(args, arrayArguments, fn) {
//   Object.keys(args).forEach(key => {
//     if (arrayArguments.includes(key)) {
//       args[key].forEach((a, i) => {
//         fn(a, "element" + i, newValue => (args[key][i] = newValue));
//       });
//     } else {
//       fn(args[key], key, newValue => (args[key] = newValue));
//     }
//   });
// }

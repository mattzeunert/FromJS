// import { InMemoryLogServer, operations, babelPlugin } from "@fromjs/core";
// importing @fromjs/core only works in a node environment because it loads babel
// so import files directly here
import operations from "../../core/src/operations";
import babelPlugin from "../../core/src/babelPlugin";
import * as React from "react";
import * as ReactDom from "react-dom";
import OperationLog from "../../core/src/helperFunctions/OperationLog";
const traverse = (x) => null;
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
import * as cx from "classnames";

window["__debugActions"] = actions;

import * as api from "./api";
window["__debugApi"] = api;

import "./main.scss";
import { App2 } from "./CodeViewer";
import { ErrorBoundary } from "./ErrorBoundary";

// global function used by tree view html
window["showSteps"] = function (logId, charIndex) {
  actions.selectAndTraverse(logId, charIndex);
};

let App = class extends React.Component<any, any> {
  constructor(props) {
    super(props);
    this.state = {
      isForceUpdating: false,
    };
    window["forceUpdateInspector"] = () => {
      this.setState({ isForceUpdating: true });
    };
  }
  render() {
    const { props } = this;
    const hasInspectorData = props.hasInspectorData;

    if (this.state.isForceUpdating) {
      this.setState({ isForceUpdating: false });
      return null;
    }

    const expandWelcome = !hasInspectorData;
    const welcome = false && (props.isInspectingDemoApp || !hasInspectorData) && (
      <div
        className="welcome"
        style={{
          maxWidth: 800,
        }}
      >
        <div className="welcome-content">
          <h3
            style={{
              marginTop: 5,
              marginBottom: 10,
            }}
          >
            Get Started
          </h3>
          <div>
            <p>
              To inspect any website open a new tab in this browser and load it.{" "}
              <a href="http://todomvc.com/examples/backbone/" target="_blank">
                Try it!
              </a>
            </p>
            <p>
              To select the value you want to inspect:
              <br /> 1) Click "Enable DOM Inspector" and then select an element{" "}
              <br />
              2) Use <code>fromJSInspect(value)</code>
              in your source code
            </p>
            <p>
              After selecting a value this page will show its dataflow
              information.
            </p>
            <p>
              Ask questions and report bugs{" "}
              <a href="https://github.com/mattzeunert/FromJS/issues">
                on Github
              </a>
              .
            </p>

            <button
              className={cx("load-demo-app", {
                "load-demo-app--hide": props.isInspectingDemoApp,
              })}
              // onClick={() =>
              //   actions.setIsInspectingDemoApp(!props.isInspectingDemoApp)
              // }
            >
              {props.isInspectingDemoApp ? "Hide" : "Load"} demo app
            </button>
          </div>
        </div>
        {props.isInspectingDemoApp && (
          <div
            style={{ margin: 10 }}
            dangerouslySetInnerHTML={{
              __html: `<iframe src="http://localhost:${location.port}/start/" />`,
            }}
          />
        )}
      </div>
    );
    return (
      <div
        className={cx("app", {
          "app--isInspectingDemoApp": props.isInspectingDemoApp,
        })}
      >
        <div className="app-header">
          <a
            href="https://github.com/mattzeunert/FromJS"
            style={{ color: "white", textDecoration: "none" }}
            target="_blank"
          >
            FromJS Dataflow Inspector
          </a>
          <div style={{ float: "right" }}>
            {location.href.includes("?debug") && (
              <button
                className="blue-button"
                onClick={() =>
                  appState.set("debugMode", !appState.get("debugMode"))
                }
              >
                Toggle Debug Mode
              </button>
            )}
            {/* <button
              className="blue-button"
              onClick={() => {
                const newValue = !props.enableInstrumentation;
                api.setEnableInstrumentation(newValue);
                if (!newValue) {
                  alert(
                    "Pages you open now will not be instrumented, so they'll load faster. Use it to do stuff like logging into accounts. Then re-enable later."
                  );
                }
              }}
            >
              {props.enableInstrumentation ? "Disable" : "Enable"} tracking
            </button> */}

            <button
              className="blue-button"
              onClick={() => {
                actions.setPrettifyIfNoSourceMap(!props.prettifyIfNoSourceMap);
              }}
            >
              {props.prettifyIfNoSourceMap
                ? "Don't prettify"
                : "Prettify if no source map"}
            </button>
          </div>
        </div>
        <div className="app-content">
          <div className="app__inspector">
            {!props.isInspectingDemoApp && welcome}
            <DomInspector />
            <TraversalSteps />
          </div>

          <div className="app__demo">
            {props.isInspectingDemoApp && welcome}
          </div>
        </div>
      </div>
    );
  }
};

App = branch(
  {
    isInspectingDemoApp: ["isInspectingDemoApp"],
    hasInspectorData: ["hasInspectorData"],
    enableInstrumentation: ["enableInstrumentation"],
    collapseGetStartedIfHasData: ["collapseGetStartedIfHasData"],
    prettifyIfNoSourceMap: ["prettifyIfNoSourceMap"],
  },
  App
);

class App2Wrapper extends React.Component {
  render() {
    console.log("rendering app2");
    return (
      <App2
        App={App}
        setQueryParam={(name, value) => {
          let qp = getQueryParams();
          qp[name] = value;
          history.pushState({}, "", addQueryParams(location.pathname, qp));
          this.forceUpdate();
        }}
        {...getQueryParams()}
      />
    );
  }
}

console.log(!location.href.includes("xyzviewer"));
if (!location.href.includes("xyzviewer")) {
  App = root(appState, App);

  ReactDom.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>,
    document.querySelector("#app")
  );
} else {
  console.log("xyz");
  const App2WrapperX = root(appState, App2Wrapper);
  ReactDom.render(
    <App2WrapperX></App2WrapperX>,
    document.querySelector("#appx")
  );
}

export function getQueryParams(): { [x: string]: string } {
  var queryParams = {};
  location.search
    .slice(1)
    .split("&")
    // if no query string don't return {"": undefined}
    .filter((arg) => !!arg)
    .forEach(function (param) {
      const parts = param.split("=");
      queryParams[parts[0]] = decodeURIComponent(parts[1]);
    });

  return queryParams;
}

function addQueryParams(url, queryObject) {
  Object.keys(queryObject).forEach((queryParamKey) => {
    let queryParamValue = queryObject[queryParamKey];

    if (Array.isArray(queryParamValue)) {
      queryParamValue = queryParamValue.join(",");
    }

    if (queryParamValue === false || queryParamValue === undefined) {
      return;
    }

    if (url.includes("?")) {
      url += "&";
    } else {
      url += "?";
    }

    url += queryParamKey + "=" + encodeURIComponent(queryParamValue);
  });

  return url;
}

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

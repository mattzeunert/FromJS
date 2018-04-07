import {
  InMemoryLogServer,
  traverse,
  operations,
  babelPlugin
} from "@fromjs/core";

// import Babel from "@babel/standalone";
// document.write("hi");

const DEBUG = true;
const USE_SERVER = true;

class ServerInterface2 {
  loadLog(logId, fn) {
    document.title = logId;
    fetch("http://localhost:4556/loadLog", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ id: logId })
    })
      .then(res => res.json())
      .then(r => {
        fn(r);
      });
  }
}

if (DEBUG) {
  document
    .querySelector("#compiled-code")
    .setAttribute("style", "display: block");
}

let serverInterface;

if (USE_SERVER) {
  serverInterface = new ServerInterface2();
} else {
  serverInterface = new InMemoryLogServer();
}

if (!USE_SERVER) {
  window["__storeLog"] = serverInterface.storeLog.bind(serverInterface);
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

const codeTextarea = <HTMLInputElement>document.querySelector("#code");

const compiledCodeTextarea = <HTMLInputElement>document.querySelector(
  "#compiled-code"
);

const chart = <HTMLElement>document.querySelector(".chart");

update();

function prettify(code) {}

function update() {
  var code = editor.getValue();
  var res = window["Babel"].transform(code, {
    plugins: [babelPlugin]
  });

  code = res.code;

  let codePromise;

  if (DEBUG) {
    prettify(code);

    codePromise = fetch("http://localhost:4555", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ code })
    })
      .then(res => res.json())
      .then(r => {
        compiledCodeTextarea.value = r.code.split(
          "/* HELPER_FUNCTIONS_END */ "
        )[1];
        return Promise.resolve(r.code);
      });
  } else {
    codePromise = Promise.resolve(code);
  }

  codePromise.then(code => runCodeAndshowResult(code));
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
  if (USE_SERVER) {
    return fetch("http://localhost:4556/traverse", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ logId: logId, charIndex })
    }).then(res => res.json());
  } else {
    return new Promise(resolve => {
      loadLog(logId, log => {
        var steps = traverse({ operationLog: log, charIndex });
        resolve({ steps });
      });
    });
  }
}

window["showSteps"] = showSteps;
function showSteps(logId, charIndex) {
  window["updateChar"](charIndex);
  loadSteps({ logId, charIndex }).then(r => {
    var steps = r.steps;

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

    steps.forEach(step => {
      console.log(step);
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
          </div>`;
    });

    // document.querySelector("#steps").innerHTML = html;
  });
}

function runCodeAndshowResult(code) {
  try {
    eval(code);
  } catch (err) {
    chart.setAttribute("style", "opacity: 0.3");
    return;
  }

  var inspectedValue = window["inspectedValue"];
  showNormalValue(inspectedValue);

  document.querySelector("#basic-example").innerHTML = "";

  showTree(inspectedValue.tracking);
  showSteps(inspectedValue.tracking, 0);
}

function loadLog(logIndex, fn) {
  serverInterface.loadLog(logIndex, log => {
    fn(log.args.value);
  });
}

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
  var charEls = document.querySelector("#chars").children;

  Array.from(charEls).forEach(el => el.setAttribute("style", ""));

  charEls[charIndex].setAttribute("style", "color:  #f627c9;");
};

function showTree(logIndex) {
  loadLog(logIndex, log => {
    var data = log;

    if (window["inspectedValue"].normal === undefined) {
      throw Error("value is undefiend");
    }
    var config = {
      container: "#basic-example",

      connectors: {
        type: "step"
      },
      node: {
        HTMLclass: "nodeExample1"
      }
    };

    var nodeStructure;

    function isDataRootOrigin(data) {
      if (!data) {
        return false;
      }
      if (["stringLiteral", "numericLiteral"].includes(data.type)) {
        return true;
      }

      return false;
    }

    function truncate(str, maxLength) {
      if (!str || !str.slice) {
        return str;
      }
      if (str.length <= maxLength) {
        return str;
      }
      return str.slice(0, maxLength - 1) + "...";
    }

    function makeNode(data, argName = "", siblingCount = null) {
      if (
        data &&
        data.operation === "identifier"
        // data.operation === "assignmentExpression") // todo: don't ignore assignmentexpr, contains info like += operator
      ) {
        // skip it because it's not very interesting
        console.log("skipping", data);
        return makeNode(data.args.value);
      }

      if (data && data.operation === "functionArgument") {
        return makeNode(data.args.value);
      }

      var childValues;
      if (data) {
        var operation = operations[data.operation];
        childValues = operation.getArgumentsArray(data);
        if (data.operation === "assignmentExpression") {
          childValues = childValues.filter(c => c.argName !== "newValue");
          // currentvalue would matter if operation isn't "=" but e.g. "+="...
          childValues = childValues.filter(c => c.argName !== "currentValue");
        }
      } else {
        childValues = [];
      }
      childValues = childValues.filter(c => !!c.arg);
      var children = [];
      if (!isDataRootOrigin(data)) {
        children = childValues.map((child, i) =>
          makeNode(child.arg, child.argName, childValues.length - 1)
        );
      }

      var type;
      if (data) {
        type = data.operation;
        if (type === "binaryExpression") {
          type =
            "<span style='color: green;font-weight: bold;'>" +
            data.astArgs.operator +
            "</span>" +
            " " +
            type;
        }
      } else {
        type = "(" + data + ")";
      }

      var resVal;
      if (data) {
        resVal = data.result;
      } else {
        debugger;
        resVal = {
          type: "string",
          str: "todo (no data)"
        };
      }

      var valueClass = "value--other";
      var str = truncate(resVal.str, 20);
      if (resVal.type === "string") {
        valueClass = "value--string";
        str = `"${str}"`;
      } else if (resVal.type == "number") {
        valueClass = "value--number";
      }

      var node = {
        innerHTML: `<span class="value ${valueClass}">${str}</span>`,

        children: [
          {
            innerHTML: `<div class="operation" data-index="${data.index}">
              ${type}
            </div>`,
            children
          }
        ]
      };

      if (
        argName &&
        siblingCount >
          0 /* if only one child in total don't bother explaining it */
      ) {
        node = {
          innerHTML: `<div style="font-weight: normal">${argName}</div>`,
          children: [node]
        };
      }

      return node;
    }
    nodeStructure = makeNode(data);

    var chart_config = {
      chart: {
        container: "#basic-example",

        connectors: {
          type: "step"
        },
        node: {
          HTMLclass: "nodeExample1"
        },
        levelSeparation: 20
      },
      nodeStructure: nodeStructure
    };

    new window["Treant"](chart_config);
  });
}

window["showResult"] = update;

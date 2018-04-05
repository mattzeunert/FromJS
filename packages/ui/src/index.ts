import babelPlugin from "../../babel-plugin-data-flow";
import operations from "../../babel-plugin-data-flow/src/operations"
import traverse from '../../babel-plugin-data-flow/src/traverse'
import ServerInterface from '../../babel-plugin-data-flow/src/ServerInterface'

// import Babel from "@babel/standalone";
// document.write("hi");

class ServerInterface2 {
  loadLog(logId, fn) {
    document.title = logId
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
        fn(r)
      });
  }
}

const serverInterface = new ServerInterface2()
// window["__storeLog"] = serverInterface.storeLog.bind(serverInterface)

var editor = window["CodeMirror"].fromTextArea(
  document.getElementById("code"),
  {
    mode: "javascript",
    lineNumbers: true
  }
);
editor.on("change", function (cMirror) {
  // get value right from instance
  codeTextarea.value = cMirror.getValue();
  try {
    chart.setAttribute("style", "opacity: 0.3");
    showResult();
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

showResult();

function showResult() {
  var code = editor.getValue();
  var res = window["Babel"].transform(code, {
    plugins: [babelPlugin]
  });

  code = res.code;
  fetch("http://localhost:4555", {
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
      runCodeAndshowResult(r.code);
    });
}

// TODO: don't copy/paste this
function eachArgument(args, arrayArguments, fn) {
  Object.keys(args).forEach(key => {
    if (arrayArguments.includes(key)) {
      args[key].forEach((a, i) => {
        fn(a, "element" + i, newValue => args[key][i] = newValue)
      })
    }
    else {
      fn(args[key], key, newValue => args[key] = newValue)
    }
  })
}

function showSteps(data) {
  var steps = traverse(data, 0).reverse()
  var html = ``

  steps.forEach(step => {
    console.log(step)
    var tv = step.operationLog
    var args = ""
    eachArgument(tv.args, ["elements"], (arg, argName) => {
      args += argName + ":" + (arg && arg.result.str) + ","
    })
    html += `<div>
      ${tv.operation} (char: ${step.charIndex})
      ${args}  
    </div>`
  })

  document.querySelector("#steps").innerHTML = html

}

function runCodeAndshowResult(code) {
  eval(code);
  console.log(window["inspectedValue"]);

  document.querySelector("#basic-example").innerHTML = "";

  serverInterface.loadLog(window["inspectedValue"].tracking, function (log) {
    var data = log.args.value.args.value
    showResultR(data)
  })
}

function showResultR(data) {
  showSteps(data)

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
      eval("false") &&
      (data.operator === "identifier" ||
        // data.type === "callExpression" ||
        data.operator === "assignmentExpression") // tood: don't ignore assignmentexpr, contains info like += operator
    ) {
      // skip it because it's not very interesting
      console.log("skipping", data);
      return makeNode(Object.values(data.args)[0]);
    }

    var childValues;
    if (data) {
      var operation = operations[data.operation]
      childValues = operation.getArgumentsArray(data)


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
      resVal = data.result
    } else {
      resVal = {
        type: "string",
        str: "todo.(no data)"
      }
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
          innerHTML: `<div class="operation">
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
      }
    },
    nodeStructure: nodeStructure
  };

  new window["Treant"](chart_config);
}

window["showResult"] = showResult;

import babelPlugin from "../../babel-plugin-data-flow";

// import Babel from "@babel/standalone";
// document.write("hi");

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

function runCodeAndshowResult(code) {
  eval(code);
  console.log(window["inspectedValue"]);

  document.querySelector("#basic-example").innerHTML = "";

  debugger;
  var data =
    window["inspectedValue"].tracking.argTrackingValues[0].argTrackingValues[0];

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
      (data.type === "identifier" ||
        // data.type === "callExpression" ||
        data.type === "assignmentExpression") // tood: don't ignore assignmentexpr, contains info like += operator
    ) {
      // skip it because it's not very interesting
      console.log("skipping", data);
      return makeNode(data.argTrackingValues[0]);
    }

    var childValues;
    if (data) {
      childValues = data.argTrackingValues.map((child, i) => {
        console.log(child);

        // if (child === null || child === undefined) {
        //   return;
        // }

        return {
          child,
          argName: data.argNames[i]
        };
      });

      if (data.extraTrackingValues) {
        childValues = childValues.concat(
          data.extraTrackingValues.map((v, i) => {
            return {
              child: v,
              argName: data.extraTrackingValueArgNames
                ? data.extraTrackingValueArgNames[i]
                : "unknown extra tracking value arg name"
            };
          })
        );
      }
    } else {
      childValues = [];
    }
    childValues = childValues.filter(c => !!c.child);
    var children = [];
    if (!isDataRootOrigin(data)) {
      children = childValues.map((child, i) =>
        makeNode(child.child, child.argName, childValues.length - 1)
      );
    }

    var type;
    if (data) {
      type = data.type;
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
      resVal =
        data.type === "functionArgument" ? data.argValues[0] + "" : data.resVal;
    } else {
      resVal = "todo..";
    }

    var extra = data
      ? data.type === "functionArgument" ? data.fnToString.slice(0, 20) : "-"
      : "";

    var valueClass = "value--other";
    if (typeof resVal == "string") {
      valueClass = "value--string";
      resVal = `"${resVal}"`;
    } else if (typeof resVal == "number") {
      valueClass = "value--number";
    }

    resVal = truncate(resVal + "", 20);

    var node = {
      innerHTML: `<span class="value ${valueClass}">${resVal}</span>`,

      children: [
        {
          innerHTML: `<div class="operation">
            ${type}
            <!--<div>${extra}</div>-->
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

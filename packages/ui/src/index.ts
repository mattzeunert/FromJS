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
  compiledCodeTextarea.value = code.split("/* HELPER_FUNCTIONS_END */ ")[1];
  eval(code);
  console.log(window["inspectedValue"]);

  document.querySelector("#basic-example").innerHTML = "";

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

  function makeNode(data) {
    if (
      data &&
      eval("false") &&
      (data.type === "identifier" ||
        // data.type === "functionReturnValue" ||
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

        return child;
      });

      if (data.extraTrackingValues) {
        childValues = childValues.concat(data.extraTrackingValues);
      }
    } else {
      childValues = [];
    }

    // childValues = childValues.filter(c => !!c);
    var children = [];
    if (!isDataRootOrigin(data)) {
      children = childValues.map(makeNode);
      if (data && data.type === "binaryExpression") {
        children = children.slice(1);
      }
    }

    var type;
    if (data) {
      type = data.type;
      if (type === "binaryExpression") {
        type =
          "<span style='color: green;font-weight: bold;'>" +
          data.argValues[0] +
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

    return {
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

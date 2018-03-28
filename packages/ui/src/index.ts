import babelPlugin from "../../babel-plugin-data-flow";
import operations from "../../babel-plugin-data-flow/src/operations"

// import Babel from "@babel/standalone";
// document.write("hi");

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

function runCodeAndshowResult(code) {
  eval(code);
  console.log(window["inspectedValue"]);

  document.querySelector("#basic-example").innerHTML = "";

  var data = window["inspectedValue"].tracking.args.value[1].args.value[1]


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
      return makeNode(Object.values(data.args)[0][1]);
    }

    var childValues;
    if (data) {
      function getArgsArray(args) {
        var arrayArguments = []
        var operation = operations[data.operation]
        if (operation && operation.arrayArguments) {
          arrayArguments = operation.arrayArguments
        }

        var ret = []
        Object.keys(args).forEach(key => {
          if (arrayArguments.includes(key)) {
            args[key].forEach((a, i) => {
              ret.push({ child: a[1], argName: "element" + i })
            })
          }
          else {
            ret.push({
              child: args[key][1],
              argName: key,
            })
          }
        })

        return ret
      }



      childValues = getArgsArray(data.args)

      if (data.extraArgs) {
        childValues = childValues.concat(
          getArgsArray(data.extraArgs)
        )
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
      resVal = "todo.(no data)";
    }


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

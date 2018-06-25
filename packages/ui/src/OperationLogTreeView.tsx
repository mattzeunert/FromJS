import * as React from "react";
import { resolveStackFrame } from "./api";
import operations from "../../core/src/operations";
import { template } from "lodash";
import OperationLog from "../../core/src/helperFunctions/OperationLog";

type OperationLogTreeViewProps = {
  operationLog: any;
};

export default class OperationLogTreeView extends React.Component<
  OperationLogTreeViewProps,
  {}
> {
  id = Math.floor(Math.random() * 100000000000);

  render() {
    return (
      <div
        className="chart"
        style={{ width: "100%", height: 500, border: "1px solid #ddd" }}
        id={this.getContainerId()}
      />
    );
  }
  getContainerId() {
    return "operation-log-tree-view-" + this.id;
  }
  componentDidMount() {
    renderTree(this.props.operationLog, "#" + this.getContainerId());
  }
}

function renderTree(log, containerSelector) {
  console.log("rendertree", log);
  // debugger;
  var data = log;

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
      return makeNode(data.args.value, argName);
    }

    var childValues;
    const operationLogIsNotLoaded = typeof data === "number";
    if (data && operationLogIsNotLoaded) {
      return {
        innerHTML: `<div style="font-size: 11px; color: #999; font-weight: normal;">
        (${argName} not loaded in FE, inspect parent to see details.)
      </div>`,

        HTMLclass: "node--not-loaded",
        children: []
      };
    }
    if (data && !operationLogIsNotLoaded) {
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
    const hiddenValues = [];
    childValues = childValues.filter(childValue => {
      if (!childValue.arg) {
        hiddenValues.push("other");
        return false;
      }
      if (
        data.operation === "callExpression" &&
        childValue.argName === "function"
      ) {
        // Most of the time the user won't care where the called function originated
        hiddenValues.push("function");
        return false;
      }
      if (
        data.operation === "callExpression" &&
        childValue.argName === "context" &&
        (!childValue.arg.result || childValue.arg.result.type === "object") // context matters if it's e.g. a string, but not if you do e.g. Math.function (i.e. object is Math)
      ) {
        hiddenValues.push("context");
        return false;
      }
      if (
        data.operation === "callExpression" &&
        childValue.argName === "returnValue"
      ) {
        hiddenValues.push("returnValue");
        return false;
      }
      return true;
    });

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
      resVal = (data as OperationLog).result;
    } else {
      // debugger;
      resVal = {
        type: "string",
        str: "todo (no data)",
        getTruncatedUIString: function() {
          return this.str;
        }
      };
    }

    var valueClass = "value--other";
    var str = truncate(resVal.getTruncatedUIString(), 40 * 10000);
    if (resVal.type === "string") {
      valueClass = "value--string";
      str = `"${str}"`;
    } else if (resVal.type == "number") {
      valueClass = "value--number";
    }

    const treeCodeDivId =
      "tree-code-div-" + Math.floor(Math.random() * 1000000000000000);

    const index = data ? data.index : "n/a";

    const escapedStr = template("<%- str %>!")({ str });

    console.log({ argName });

    var node = {
      innerHTML: `<div>
        <div
          style="font-weight: normal; overflow: hidden;text-align: left; border-bottom: 1px solid #ddd;padding-bottom: 2px;margin-bottom: 2px;">
          ${argName}
          <span style="font-weight: normal; font-size: 11px; color: #999;">(${type})</span>
          <button style="cursor: pointer; float: right;    border: none;
          text-decoration: underline;" onclick="showSteps(${index}, 0)">Inspect</button>
        </div>
        <div class="operation" data-index="${index}">
          <div class="code-container">
            <code style="font-size: 11px" id="${treeCodeDivId}">&nbsp;</code>
          </div>
          <div>
            <span class="value ${valueClass}">${escapedStr}</span>
          </div>  
        </div>
        ${
          hiddenValues.length > 1
            ? "Hidden ancestor values: " + hiddenValues.join(", ")
            : ""
        }
        
      </div>`,

      children
    };

    if (data && !operationLogIsNotLoaded) {
      resolveStackFrame(data)
        .then(stackFrame => {
          document.querySelector("#" + treeCodeDivId).innerHTML =
            stackFrame.code.line.text;
        })
        .catch(() => {
          document.querySelector("#" + treeCodeDivId).innerHTML = "(error)";
        });
    }

    return node;
  }
  nodeStructure = makeNode(data);

  var chart_config = {
    chart: {
      container: containerSelector,

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

  window["yyyyy"] = new window["Treant"](chart_config);
}

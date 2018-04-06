// todo: would be better if the server provided this value
const getOperationIndex = (function() {
  var operationIndexBase = Math.round(Math.random() * 1000 * 1000 * 1000);
  var operationIndex = 0;
  return function getOperationIndex() {
    var index = operationIndex;
    operationIndex++;
    return operationIndexBase + operationIndex;
  };
})();

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

function serializeValue(value): SerializedValue {
  // todo: consider accessing properties that are getters could have negative impact...
  var knownValue = null;
  if (value === String.prototype.slice) {
    knownValue = "String.prototype.slice";
  }
  var length;
  // todo: more performant way than doing try catch
  try {
    length = value.length;
  } catch (err) {
    length = null;
  }

  var type = typeof value;

  var primitive;
  if (["string", "null", "number"].includes(type)) {
    primitive = value;
  }
  let str;
  try {
    str = (value + "").slice(0, 200);
  } catch (err) {
    str = "(Error while serializing)";
  }

  return <SerializedValue>{
    length,
    type,
    str,
    primitive,
    knownValue
  };
}

export interface SerializedValue {
  length: any;
  type: string;
  str: string;
  primitive: number | null | string;
  knownValue: string | null;
}

export default class OperationLog {
  operation: string;
  result: SerializedValue;
  args: any;
  extraArgs: any;
  index: number;
  astArgs: any;

  constructor({ operation, result, args, astArgs, extraArgs }) {
    var arrayArguments = [];
    if (operation === "arrayExpression") {
      arrayArguments = ["elements"];
    }

    this.operation = operation;
    this.result = serializeValue(result);
    if (operation === "objectExpression" && args.properties) {
      // todo: centralize this logic, shouldn't need to do if, see "arrayexpression" above also"
      args.properties = args.properties.map(prop => {
        return {
          key: prop.key[1],
          type: prop.type[1],
          value: prop.value[1]
        };
      });
    } else {
      // only store argument operation log because ol.result === a[0]
      eachArgument(args, arrayArguments, (arg, argName, updateArg) => {
        updateArg(arg[1]);
      });
    }
    if (typeof extraArgs === "object") {
      eachArgument(extraArgs, arrayArguments, (arg, argName, updateArg) => {
        updateArg(arg[1]);
      });
    }
    this.args = args;
    this.astArgs = astArgs;
    this.extraArgs = extraArgs;
    this.index = getOperationIndex();
  }
}

import KnownValues from "./KnownValues";
import { VERIFY } from "../config";

var global = Function("return this")();

// todo: would be better if the server provided this value
export const getOperationIndex = (function() {
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

function serializeValue(value, knownValues: KnownValues): SerializedValue {
  // todo: consider accessing properties that are getters could have negative impact...

  var knownValue: null | string = knownValues.getName(value);

  var length;

  if (
    typeof value === "string" ||
    (typeof value === "object" && value !== null && "length" in value)
  ) {
    // need try catch because you e.g. NodeList has length but you can't acces it
    // because it's illegal invocation
    try {
      length = value.length;
    } catch (err) {}
  }

  var type = typeof value;

  var knownTypes: any[] | null = null;
  if (
    global["HTMLInputElement"] &&
    value instanceof global["HTMLInputElement"]
  ) {
    knownTypes = [];
    knownTypes.push("HTMLInputElement");
  }

  var primitive = "";
  if (["string", "null", "number", "boolean"].includes(type)) {
    primitive = value;
  }
  let str;
  let keys;
  try {
    if (type === "object" && value !== null) {
      // todo: rethink this regarding perf
      // maybe don't collect keys, maybe do for...in instead
      // also: when inspecting i really want the trakcing data for
      // values/keys to be accessible, so maybe just storing keys makes more sense
      keys = Object.keys(value);
      if (keys.length > 6) {
        keys = keys.slice(0, 6);
        keys.push("...");
      }
    }
  } catch (err) {}

  return <SerializedValue>{
    length,
    type,
    primitive,
    knownValue,
    knownTypes,
    keys
  };
}

export interface SerializedValue {
  length: any;
  type: string;
  keys?: string[];
  primitive: number | null | string;
  knownValue: string | null;
  knownTypes: null | any[];
}

export default class OperationLog {
  operation: string;
  result: SerializedValue;
  args: any;
  extraArgs: any;
  index: number;
  astArgs: any;
  stackFrames: string[];
  loc: any;
  runtimeArgs: any;

  constructor({
    operation,
    result,
    args,
    astArgs,
    extraArgs,
    stackFrames,
    loc,
    knownValues,
    runtimeArgs,
    index
  }) {
    var arrayArguments: any[] = [];
    if (operation === "arrayExpression") {
      arrayArguments = ["elements"];
    }

    if (VERIFY && !loc) {
      console.log("no loc at runtime for operation", operation);
    }

    this.stackFrames = stackFrames;

    this.operation = operation;
    this.result = serializeValue(result, knownValues);
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
        if (
          VERIFY &&
          typeof arg[1] !== "number" &&
          arg[1] !== null &&
          arg[1] !== undefined &&
          arg[1] !== false
        ) {
          debugger;
          throw Error(
            "no arg operationlog found, did you only pass in an operationlog"
          );
        }
        updateArg(arg[1]);
      });
    }
    if (typeof extraArgs === "object") {
      eachArgument(extraArgs, arrayArguments, (arg, argName, updateArg) => {
        if (
          VERIFY &&
          typeof arg[1] !== "number" &&
          arg[1] !== null &&
          arg[1] !== undefined &&
          arg[1] !== false
        ) {
          debugger;
          throw Error(
            "no arg operationlog found, did you only pass in an operationlog"
          );
        }
        updateArg(arg[1]);
      });
    }
    this.runtimeArgs = runtimeArgs;
    this.loc = loc;
    this.args = args;
    this.astArgs = astArgs;
    this.extraArgs = extraArgs;
    this.index = index;
  }
}

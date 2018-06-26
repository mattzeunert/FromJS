import KnownValues from "./KnownValues";
import { VERIFY } from "../config";
import operations from "../operations";
import invokeIfFunction from "../invokeIfFunction";

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

function serializeValue(
  value,
  knownValues: KnownValues
): StoredSerializedValue {
  // todo: consider accessing properties that are getters could have negative impact...

  const type = typeof value;

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return value;
  }

  return getSerializedValueObject(value, type, knownValues);
}

export interface SerializedValueData {
  length: any;
  type: string;
  keys?: string[];
  primitive: number | null | string | boolean;
  knownValue: string | null;
  knownTypes: null | any[];
}

type StoredSerializedValue = SerializedValueData | string | number | boolean;

function getSerializedValueObject(value, type, knownValues) {
  var knownValue: undefined | string =
    knownValues && knownValues.getName(value);

  if (type === null) {
    type = typeof value;
  }

  var length;

  if (
    typeof value == "string" ||
    (typeof value === "object" && value !== null && "length" in value)
  ) {
    // need try catch because you e.g. NodeList has length but you can't acces it
    // because it's illegal invocation
    try {
      length = value.length;
    } catch (err) {}
  }

  var knownTypes: any[] | null = undefined;
  if (
    global["HTMLInputElement"] &&
    value instanceof global["HTMLInputElement"]
  ) {
    knownTypes = [];
    knownTypes.push("HTMLInputElement");
  }

  var primitive;
  if (["string", "number", "boolean", "null"].includes(type)) {
    primitive = value;
  }
  let keys;
  try {
    if (type === "object" && value !== null) {
      // todo: rethink this regarding perf
      // maybe don't collect keys, maybe do for...in instead
      // also: when inspecting i really want the trakcing data for
      // values/keys to be accessible, so maybe just storing keys makes more sense
      keys = Object.keys(value);
      if (keys.length > 5) {
        keys = keys.slice(0, 5);
        keys.push("...");
      }
    }
  } catch (err) {}

  return <SerializedValueData>{
    length,
    type,
    primitive,
    knownValue,
    knownTypes,
    keys
  };
}

class SerializedValue implements SerializedValueData {
  length: any;
  type: string;
  keys?: string[];
  primitive: number | null | string | boolean;
  knownValue: string | null;
  knownTypes: null | any[];

  constructor(data: SerializedValueData) {
    this.length = data.length;
    this.type = data.type;
    this.keys = data.keys;
    this.primitive = data.primitive;
    this.knownValue = data.knownValue;
    this.knownTypes = data.knownTypes;
  }

  getTruncatedUIString() {
    if (["string", "null", "number", "boolean"].includes(this.type)) {
      let ret = this.primitive + "";
      if (ret.length > 200) {
        return ret.slice(0, 200);
      } else {
        return ret;
      }
    }
    let str = "[" + this.type + "]";
    if (this.keys && this.keys.length > 0) {
      str += " {" + this.keys.join(", ") + "}";
    }
    return str;
  }
}

interface OperationLogInterface {
  operation: string;
  _result: StoredSerializedValue;
  args: any;
  extraArgs: any;
  index: number;
  astArgs: any;
  stackFrames: string[];
  loc: any;
  runtimeArgs: any;
}

export default class OperationLog implements OperationLogInterface {
  operation: string;
  _result: StoredSerializedValue;
  args: any;
  extraArgs: any;
  index: number;
  astArgs: any;
  stackFrames: string[];
  loc: any;
  runtimeArgs: any;

  get result(): SerializedValue {
    const resultIsSerializedValueObject =
      !["string", "boolean", "number"].includes(typeof this._result) &&
      this._result !== null &&
      "type" in <any>this._result &&
      "knownValue" in <any>this._result;

    let sv: SerializedValueData;
    if (resultIsSerializedValueObject) {
      sv = <SerializedValueData>this._result;
    } else {
      sv = getSerializedValueObject(this._result, null, null);
    }

    return new SerializedValue(sv);
  }

  static createAtRuntime;

  constructor({
    operation,
    _result,
    args,
    astArgs,
    extraArgs,
    stackFrames,
    loc,
    runtimeArgs,
    index
  }) {
    this.stackFrames = stackFrames;

    this.operation = operation;
    this._result = _result;
    this.runtimeArgs = runtimeArgs;
    this.loc = loc;
    this.args = args;
    this.astArgs = astArgs;
    this.extraArgs = extraArgs;
    this.index = index;
  }
}
OperationLog.createAtRuntime = function(
  { operation, result, args, astArgs, extraArgs, loc, runtimeArgs, index },
  knownValues
): OperationLogInterface {
  if (VERIFY && !loc) {
    console.log("no loc at runtime for operation", operation);
  }
  const op = operations[operation];

  if (Array.isArray(args)) {
    const newArgs: any[] = [];
    args.forEach((arg, i) => {
      if (
        op["argIsArray"] &&
        invokeIfFunction(op["argIsArray"]![i], arguments[0])
      ) {
        const a: any[] = [];
        arg.forEach((arrayArg, arrayArgIndex) => {
          a.push(arrayArg[1]);
        });
        newArgs.push(a);
      } else {
        newArgs.push(arg[1]);
      }
    });

    args = newArgs;

    if (args.length === 1 && !args[0]) {
      args = undefined;
    }
  } else {
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
      eachArgument(args, (arg, argName, updateArg) => {
        verifyArg(arg);
        updateArg(arg[1]);
      });
    }
  }

  if (typeof extraArgs === "object") {
    eachArgument(extraArgs, (arg, argName, updateArg) => {
      verifyArg(arg);
      updateArg(arg[1]);
    });
  }

  let _result;
  if (op && op.canInferResult) {
    // args can be inferred on BE by checking the AST loc data
  } else {
    _result = serializeValue(result, knownValues);
  }

  return <OperationLogInterface>{
    operation,
    _result,
    index,
    extraArgs,
    args,
    astArgs,
    loc,
    runtimeArgs
  };
};

// TODO: don't copy/paste this
function eachArgument(args, fn) {
  const keys = Object.keys(args);
  for (var i = 0; i < keys.length; i++) {
    const key = keys[i];
    fn(args[key], key, newValue => (args[key] = newValue));
  }
}

function verifyArg(arg) {
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
}

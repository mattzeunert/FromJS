import KnownValues from "./KnownValues";
import { VERIFY, MINIMIZE_LOG_DATA_SIZE, SHORT_NAMES } from "../config";
import invokeIfFunction from "../invokeIfFunction";
import { consoleLog } from "./logging";
import { countObjectKeys } from "../util";
import { ValueTrackingValuePair } from "../types";
import { getShortOperationName, getLongOperationName } from "../names";

var global = Function("return this")();

// todo: would be better if the server provided this value
export const getOperationIndex = (function() {
  var operationIndexBase = Math.round(
    Math.random() * 1000 * 1000 * 1000 * 1000 * 1000
  );
  var operationIndex = operationIndexBase;
  return function getOperationIndex() {
    operationIndex++;
    return operationIndex;
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

const _bufferObj = eval("typeof Buffer === 'undefined' ? null : Buffer");

export interface SerializedValueData {
  length: any;
  type: string;
  keys?: string[];
  primitive: number | null | string | boolean;
  knownValue: string | null;
  knownTypes: null | any[];
}

type StoredSerializedValue = SerializedValueData | string | number | boolean;

export function getSerializedValueObject(
  value,
  type,
  knownValues,
  preventShortNames = false
) {
  var knownValue: undefined | string =
    knownValues && knownValues.getName(value);

  if (type === null) {
    type = typeof value;
  }

  var length;

  if (Array.isArray(value) || type === "string") {
    length = value.length;
  }

  var knownTypes: any[] | undefined = undefined;
  if (
    global["HTMLInputElement"] &&
    value instanceof global["HTMLInputElement"]
  ) {
    knownTypes = [];
    knownTypes.push("HTMLInputElement");
  }
  try {
    if (
      type === "object" &&
      "lastEventId" in value &&
      typeof value.target === "object" &&
      typeof value.target.url === "string" &&
      value.target.url.startsWith("ws") &&
      value.type === "message"
    ) {
      knownTypes = [];
      knownTypes.push("WebSocketMessage");
    }
  } catch (err) {
    // some cases where there are getters that can't
    // be invoked
  }

  var primitive;
  if (["string", "number", "boolean", "null"].includes(type)) {
    primitive = value;
  }
  let keys;
  try {
    if (
      type === "object" &&
      value !== null &&
      !Array.isArray(value) &&
      !knownValue &&
      (!_bufferObj || !(value instanceof _bufferObj))
    ) {
      // todo: rethink this regarding perf
      // maybe don't collect keys, maybe do for...in instead
      // also: when inspecting i really want the trakcing data for
      // values/keys to be accessible, so maybe just storing keys makes more sense
      keys = Object.keys(value);
      if (keys.length > 100) {
        console.log(
          "Obj with more than 100 keys: " + keys.length,
          keys.slice(0, 5)
        );
      }
      if (keys.length > 5) {
        keys = keys.slice(0, 5);
        keys.push("...");
      }
    }
  } catch (err) {}

  if (SHORT_NAMES && !preventShortNames) {
    if (type === "object") {
      type = "o";
    } else if (type === "function") {
      type = "f";
    } else if (type === "undefined") {
      type = "u";
    }
    return {
      l: length,
      t: type,
      p: primitive,
      k: knownValue,
      kt: knownTypes,
      ke: keys
    } as any;
  } else {
    return <SerializedValueData>{
      length,
      type,
      primitive,
      knownValue,
      knownTypes,
      keys
    };
  }
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
    if (this.knownValue) {
      return this.knownValue;
    }
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
      str += " {" + this.keys.filter(k => k !== "__elOrigin").join(", ") + "}";
    }
    return str;
  }

  isTruthy() {
    if (this.primitive) {
      return !!this.primitive;
    }
    return this.length > 0 || (this.keys && this.keys.length > 0);
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
      this._result &&
      "type" in <any>this._result;

    let sv: SerializedValueData;
    if (resultIsSerializedValueObject) {
      sv = <SerializedValueData>this._result;
    } else {
      sv = getSerializedValueObject(this._result, null, null, true);
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

interface CreateAtRuntimeArg {
  operation: string;
  result: any;
  args: // Simple arg data, something like { originValue: ["hello", 2638723923] }
  | { [argName: string]: ValueTrackingValuePair }
    // For object literals
    | {
        properties: {
          key: any;
          type: any;
          value: any;
        }[];
      }
    // Optimization using arrays instead of objects, e.g. for call expressions, array literals,...
    | (ValueTrackingValuePair | ValueTrackingValuePair[])[]
    | undefined;
  astArgs: any;
  extraArgs: any;
  loc: string;
  runtimeArgs: any;
  index: number;
}

OperationLog.createAtRuntime = function(
  {
    operation,
    result,
    args,
    astArgs,
    extraArgs,
    loc,
    runtimeArgs
  }: CreateAtRuntimeArg,
  knownValues,
  op
): OperationLogInterface {
  if (VERIFY && !loc) {
    consoleLog(
      "no loc at runtime for operation",
      getLongOperationName(operation)
    );
  }

  let canInfer = false;
  if (MINIMIZE_LOG_DATA_SIZE) {
    let opCanInfer = op && op.canInferResult;
    if (typeof opCanInfer === "boolean") {
      canInfer = opCanInfer;
    } else if (typeof opCanInfer === "function" && args) {
      canInfer = opCanInfer(args, extraArgs, astArgs, runtimeArgs);
    }
  }

  if (astArgs && countObjectKeys(astArgs) === 0) {
    astArgs = undefined;
  }

  // When args come into this function they contain both the actual value and
  // the tracking value. We only want the tracking value now.
  if (Array.isArray(args)) {
    const newArgs: any[] = [];

    for (var i = 0; i < args.length; i++) {
      const arg = args[i];
      if (
        op["argIsArray"] &&
        invokeIfFunction(op["argIsArray"]![i], arguments[0])
      ) {
        const a: any[] = [];
        for (
          var arrayArgIndex = 0;
          arrayArgIndex < arg.length;
          arrayArgIndex++
        ) {
          const arrayArg = arg[arrayArgIndex];
          a.push(arrayArg[1]);
        }

        newArgs.push(a);
      } else {
        newArgs.push(arg[1]);
      }
    }

    args = newArgs;

    if (args.length === 1 && !args[0]) {
      args = undefined;
    }
  } else if (args) {
    // Not sure why the (args as any) is needed, but without it the UI bundle
    // doesn't compile
    if (operation === "objectExpression" && (args as any).properties) {
      // todo: centralize this logic, shouldn't need to do if, see "arrayexpression" above also"

      (args as any).properties = ((args as any).properties as any[]).map(
        prop => {
          return {
            key: prop.key[1],
            type: prop.type[1],
            value: prop.value[1]
          };
        }
      );
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
  if (canInfer) {
    // args can be inferred on BE by checking the AST loc data, or by checking argument values
  } else {
    _result = serializeValue(result, knownValues);
  }

  if (SHORT_NAMES) {
    return {
      o: operation,
      r: _result,
      e: extraArgs,
      a: args,
      ast: astArgs,
      l: loc,
      rt: runtimeArgs
    } as any;
  } else {
    return <OperationLogInterface>{
      operation,
      _result,
      extraArgs,
      args,
      astArgs,
      loc,
      runtimeArgs
    };
  }
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

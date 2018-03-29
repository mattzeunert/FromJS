declare var __FUNCTION_NAMES__,
  __OPERATION_TYPES__,
  __OPERATIONS_EXEC__,
  __OPERATION_ARRAY_ARGUMENTS__;

export default function () {
  (function (
    functionNames,
    operationTypes,
    operationsExec,
    operationArrayArguments
  ) {
    function OperationLog({ operation, result, args, astArgs, extraArgs }) {
      this.operation = operation;
      this.result = result;
      this.args = args;
      this.astArgs = astArgs;
      this.extraArgs = extraArgs;
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

    function serializeValue(value) {
      return {
        type: typeof value,
        str: (value + "").slice(0, 40)
      }
    }
    OperationLog.prototype.serialize = function () {
      if (this.serialized) {
        return
      }

      const serializeArgsObject = (args) => {
        if (!args) { return {} }
        var arrayArguments = []
        if (this.operation === "arrayExpression") {
          arrayArguments = ["elements"]
        }
        eachArgument(args, arrayArguments, (arg, argName, update) => {
          var trackingValue = arg[1] && arg[1]

          if (trackingValue && trackingValue.serialize) {
            trackingValue.serialize()
          }
          var serializedTrackingValue = trackingValue

          update([null, serializedTrackingValue])
        })
      }
      this.operation = this.operation
      this.result = serializeValue(this.result)
      serializeArgsObject(this.args)
      serializeArgsObject(this.astArgs)
      serializeArgsObject(this.extraArgs)
      this.serialized = true
    }

    var global = Function("return this")();
    if (global.__didInitializeDataFlowTracking) {
      return;
    }
    global.__didInitializeDataFlowTracking = true;

    var argTrackingInfo = null;

    global[
      functionNames.getFunctionArgTrackingInfo
    ] = function getArgTrackingInfo(index) {
      if (!argTrackingInfo) {
        console.log("no arg tracking info...");
        return { info: "none" };
      }
      return argTrackingInfo[index];
    };

    global.getTrackingAndNormalValue = function (value) {
      return {
        normal: value,
        tracking: argTrackingInfo[0]
      };
    };

    global.inspect = function (value) {
      argTrackingInfo[0].serialize()
      global.inspectedValue = {
        normal: value,
        tracking: argTrackingInfo[0]
      };
    };

    const objTrackingMap = new Map();
    function trackObjectPropertyAssignment(obj, propName, trackingValue) {
      // console.log("trackObjectPropertyAssignment", obj, propName, trackingValue)
      var objectPropertyTrackingInfo = objTrackingMap.get(obj);
      if (!objectPropertyTrackingInfo) {
        objectPropertyTrackingInfo = {};
        objTrackingMap.set(obj, objectPropertyTrackingInfo);
      }
      objectPropertyTrackingInfo[propName] = trackingValue;
    }
    function getObjectPropertyTrackingValue(obj, propName) {
      var objectPropertyTrackingInfo = objTrackingMap.get(obj);
      if (!objectPropertyTrackingInfo) {
        return null;
      }
      return objectPropertyTrackingInfo[propName];
    }
    window["getObjectPropertyTrackingValue"] = getObjectPropertyTrackingValue;

    var lastMemberExpressionObjectValue = null;
    var lastMemberExpressionObjectTrackingValue = null;
    global["getLastMemberExpressionObjectValue"] = function () {
      return lastMemberExpressionObjectValue;
    };

    global["getLastMemberExpressionObjectTrackingValue"] = function () {
      return lastMemberExpressionObjectTrackingValue;
    };

    const memoValues = {};
    global["__setMemoValue"] = function (key, value, trackingValue) {
      // console.log("setmemovalue", value)
      memoValues[key] = { value, trackingValue };
      lastOpTrackingResult = trackingValue;
      return value;
    };
    global["__getMemoValue"] = function (key) {
      return memoValues[key].value;
    };
    global["__getMemoTrackingValue"] = function (key, value, trackingValue) {
      return memoValues[key].trackingValue;
    };

    var lastOpValueResult = null;
    var lastOpTrackingResult = null;
    global[functionNames.doOperation] = function op(opName: string, ...args) {
      var value, trackingValue;

      var objArgs;
      var astArgs;
      var argNames = [];

      objArgs = args[0];
      astArgs = args[1];

      args;
      if (operationArrayArguments[opName]) {
        operationArrayArguments[opName].forEach(arrayArgName => { });
      }

      var argValues = args.map(arg => arg[0]);
      var argTrackingValues = args.map(arg => {
        if (arg[1] === null) {
          return new OperationLog({
            operation: "Unknown operation",
            result: arg[0],
            args: {},
            astArgs: {},
            extraArgs: {}
          });
        }
        return arg[1];
      });
      var extraTrackingValues = {};
      var ret;
      if (operationsExec[opName]) {
        var setters = {
          lastMemberExpressionResult: arr => {
            lastMemberExpressionObjectValue = arr[0];
            lastMemberExpressionObjectTrackingValue = arr[1];
          },
          extraArgTrackingValues: values => {
            extraTrackingValues = values;
          },
          argTrackingInfo(info) {
            argTrackingInfo = info;
          }
        };
        ret = operationsExec[opName](objArgs, astArgs, {
          setters,
          operationTypes,
          getObjectPropertyTrackingValue,
          trackObjectPropertyAssignment,
          OperationLog,
          getLastOpTrackingResult() {
            return lastOpTrackingResult;
          }
        });
      } else {
        console.log("unhandled op", opName, args);
        throw Error("oh no");
      }

      trackingValue = new OperationLog({
        operation: opName,
        args: objArgs,
        astArgs: astArgs,
        result: ret,
        extraArgs: extraTrackingValues
      });

      // trackingValue = {
      //   type: opName,
      //   argValues,
      //   objArgs,
      //   argTrackingValues,
      //   extraArgs: extraTrackingValues,
      //   resVal: ret,
      //   argNames,
      //   astArgs
      //   // place: Error()
      //   //   .stack.split("\\\\n")
      //   //   .slice(2, 3)
      // };

      lastOpValueResult = ret;
      lastOpTrackingResult = trackingValue;

      return ret;
    };

    global[functionNames.getLastOperationValueResult] = function getLastOp() {
      var ret = lastOpValueResult;
      lastOpValueResult = null;
      return ret;
    };
    global[
      functionNames.getLastOperationTrackingResult
    ] = function getLastOp() {
      var ret = lastOpTrackingResult;
      lastOpTrackingResult = null;
      return ret;
    };
  })(
    __FUNCTION_NAMES__,
    __OPERATION_TYPES__,
    __OPERATIONS_EXEC__,
    __OPERATION_ARRAY_ARGUMENTS__
    );
}

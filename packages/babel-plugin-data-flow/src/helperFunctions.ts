declare var __FUNCTION_NAMES__,
  __OPERATION_TYPES__,
  __OPERATIONS_EXEC__,
  __OPERATION_ARRAY_ARGUMENTS__,
  __storeLog;

export default function () {
  (function (
    functionNames,
    operationTypes,
    operationsExec,
    operationArrayArguments
  ) {
    // todo: would be better if the server provided this value
    const getOperationIndex = (function () {
      var operationIndexBase = Math.round(Math.random() * 1000 * 1000 * 1000)
      var operationIndex = 0
      return function getOperationIndex() {
        var index = operationIndex
        operationIndex++
        return operationIndexBase + operationIndex
      }
    })()

    let logQueue = []
    setInterval(function () {
      if (logQueue.length === 0) {
        return
      }
      fetch("http://localhost:4556", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ logs: logQueue })
      })
        .then(res => res.json())
        .then(r => {
          console.log("stored logs")
        });

      console.log("saving n logs", logQueue.length)
      logQueue = []

    }, 1000)
    function remotelyStoreLog(log) {
      logQueue.push(log)
    }

    const storeLog = typeof __storeLog !== "undefined" ? __storeLog : remotelyStoreLog

    function OperationLog({ operation, result, args, astArgs, extraArgs }) {
      var arrayArguments = []
      if (operation === "arrayExpression") {
        arrayArguments = ["elements"]
      }

      this.operation = operation;
      this.result = serializeValue(result);
      // only store argument operation log because ol.result === a[0]
      eachArgument(args, arrayArguments, (arg, argName, updateArg) => {
        updateArg(arg[1])
      })
      if (typeof extraArgs === "object") {
        eachArgument(extraArgs, arrayArguments, (arg, argName, updateArg) => {
          updateArg(arg[1])
        })
      }
      this.args = args
      this.astArgs = astArgs;
      this.extraArgs = extraArgs
      this.index = getOperationIndex()
    }

    function createOperationLog(args) {
      var log = new OperationLog(args);
      storeLog(log)
      return log.index
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
      // todo: consider accessing properties that are getters could have negative impact...
      var knownValue = null
      if (value === String.prototype.slice) {
        knownValue = "String.prototype.slice"
      }
      var length
      // todo: more performant way than doing try catch
      try {
        length = value.length
      } catch (err) {
        length = null
      }

      var type = typeof value

      var primitive
      if (["string", "null", "number"].includes(type)) {
        primitive = value
      }
      return {
        length,
        type,
        str: (value + "").slice(0, 40),
        primitive,
        knownValue
      }
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
          return createOperationLog({
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
          createOperationLog,
          getLastOpTrackingResult() {
            return lastOpTrackingResult;
          }
        });
      } else {
        console.log("unhandled op", opName, args);
        throw Error("oh no");
      }

      if (opName === operationTypes.objectExpression) {
        args = []
      }

      trackingValue = createOperationLog({
        operation: opName,
        args: objArgs,
        astArgs: astArgs,
        result: ret,
        extraArgs: extraTrackingValues
      })

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

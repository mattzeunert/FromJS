import OperationLog from "./OperationLog";

declare var __FUNCTION_NAMES__,
  __OPERATION_TYPES__,
  __OPERATIONS_EXEC__,
  __OPERATION_ARRAY_ARGUMENTS__,
  __storeLog;

(function (
  functionNames,
  operationTypes,
  operationsExec,
  operationArrayArguments
) {
  var global = Function("return this")();
  if (global.__didInitializeDataFlowTracking) {
    return;
  }
  global.__didInitializeDataFlowTracking = true;



  const nativeFunctions = {
    stringPrototypeSlice: String.prototype.slice,
    stringPrototypeReplace: String.prototype.replace
  }

  function postToBE(endpoint, data) {
    return fetch("http://localhost:4556" + endpoint, {
      method: "POST",
      headers: new Headers({
        Accept: "application/json",
        "Content-Type": "application/json"
      }),
      body: JSON.stringify(data)
    })
      .then(res => res.json())
  }

  let logQueue = [];
  setInterval(function () {
    if (logQueue.length === 0) {
      return;
    }
    postToBE("/", { logs: logQueue })
      .then(r => {
        console.log("stored logs");
      });

    console.log("saving n logs", logQueue.length);
    logQueue = [];
  }, 200);
  function remotelyStoreLog(log) {
    logQueue.push(log);
  }

  const storeLog =
    typeof __storeLog !== "undefined" ? __storeLog : remotelyStoreLog;

  let lastOperationType = null
  function createOperationLog(args) {
    args.stackFrames = Error().stack.split(String.fromCharCode(10));
    args.stackFrames = args.stackFrames.filter(
      line => line !== "Error" && !line.includes("/helperFns.js")
    );
    args.nativeFunctions = nativeFunctions
    var log = new OperationLog(args);
    storeLog(log);

    // Normally we just store the numbers, but it's useful for
    // debugging to be able to view the log object
    window["__debugAllLogs"] = window["__debugAllLogs"] || {}
    window["__debugAllLogs"][log.index] = log

    return log.index;
  }


  var argTrackingInfo = null;

  global[
    functionNames.getFunctionArgTrackingInfo
  ] = function getArgTrackingInfo(index) {
    if (!argTrackingInfo) {
      console.log("no arg tracking info...");
      return null
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

  global.fromJSInspect = function (value) {
    postToBE("/inspect", {
      logId: argTrackingInfo[0]
    })
  }

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

  var lastReturnStatementResult = null

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
    const loc = args[2]

    args;
    if (operationArrayArguments[opName]) {
      operationArrayArguments[opName].forEach(arrayArgName => { });
    }

    var extraTrackingValues = {};
    var ret;
    if (operationsExec[opName]) {
      const ctx = {
        operationTypes,
        getObjectPropertyTrackingValue,
        trackObjectPropertyAssignment,
        createOperationLog,
        nativeFunctions,
        get lastOpTrackingResult() {
          return lastOpTrackingResult;
        },
        set extraArgTrackingValues(values) {
          extraTrackingValues = values;
        },
        get lastReturnStatementResult() {
          return lastReturnStatementResult
        },
        set lastMemberExpressionResult([normal, tracking]) {
          lastMemberExpressionObjectValue = normal
          lastMemberExpressionObjectTrackingValue = tracking
        },
        set argTrackingInfo(info) {
          argTrackingInfo = info
        },
        get lastOperationType() {
          return lastOperationType
        }
      }
      ret = operationsExec[opName](objArgs, astArgs, ctx)
    } else {
      console.log("unhandled op", opName, args);
      throw Error("oh no");
    }

    if (opName === operationTypes.objectExpression) {
      args = [];
    }

    trackingValue = createOperationLog({
      operation: opName,
      args: objArgs,
      astArgs: astArgs,
      result: ret,
      extraArgs: extraTrackingValues,
      loc
    });

    lastOpValueResult = ret;
    lastOpTrackingResult = trackingValue;

    if (opName === "returnStatement") {
      // should ideally be in operations.ts
      // however: it can't be in exec because there
      // the trackingvalue doesn't exist yet!
      lastReturnStatementResult = [ret, trackingValue]
    }

    lastOperationType = opName

    return ret;
  };

  global[functionNames.getLastOperationValueResult] = function getLastOp() {
    var ret = lastOpValueResult;
    lastOpValueResult = null;
    return ret;
  };
  global[functionNames.getLastOperationTrackingResult] = function getLastOp() {
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

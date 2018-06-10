import OperationLog from "./OperationLog";
import getElementOperationLogMapping from "./getHtmlNodeOperationLogMapping";
import getHtmlNodeOperationLogMapping from "./getHtmlNodeOperationLogMapping";
import initDomInspectionUI from "./initDomInspectionUI";

declare var __FUNCTION_NAMES__,
  __OPERATION_TYPES__,
  __OPERATIONS_EXEC__,
  __OPERATION_ARRAY_ARGUMENTS__,
  __storeLog;

(function(
  functionNames,
  operationTypes,
  operationsExec,
  operationArrayArguments
) {
  const accessToken = "ACCESS_TOKEN_PLACEHOLDER";

  Error["stackTraceLimit"] = 1000;

  var global = Function("return this")();
  if (global.__didInitializeDataFlowTracking) {
    return;
  }
  global.__didInitializeDataFlowTracking = true;

  global.getElementOperationLogMapping = getElementOperationLogMapping;

  const nativeFunctions = {
    stringPrototypeSlice: String.prototype.slice,
    stringPrototypeReplace: String.prototype.replace,
    stringPrototypeTrim: String.prototype.trim,
    ArrayPrototypePush: Array.prototype.push,
    ArrayPrototypeJoin: Array.prototype.join,
    jsonParse: JSON.parse
  };

  function postToBE(endpoint, data) {
    return fetch("http://localhost:BACKEND_PORT_PLACEHOLDER" + endpoint, {
      method: "POST",
      headers: new Headers({
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: accessToken
      }),
      body: JSON.stringify(data)
    }).then(res => res.json());
  }

  let logQueue = [];
  window["__debugFromJSLogQueue"] = () => logQueue;
  let evalScriptQueue = [];
  function sendLogsToServer() {
    if (logQueue.length === 0 && evalScriptQueue.length == 0) {
      return;
    }
    postToBE("/storeLogs", {
      logs: logQueue,
      evalScripts: evalScriptQueue
    }).then(r => {
      console.log("stored logs");
    });

    console.log("saving n logs", logQueue.length);
    logQueue = [];
    evalScriptQueue = [];
  }
  setInterval(sendLogsToServer, 200);
  function remotelyStoreLog(log) {
    logQueue.push(log);
  }

  const storeLog =
    typeof __storeLog !== "undefined" ? __storeLog : remotelyStoreLog;

  let lastOperationType = null;
  function createOperationLog(args) {
    args.stackFrames = []; // don't use Error().stack, use loc instead
    // args.stackFrames = Error().stack.split(String.fromCharCode(10));
    // // Sometimes the json traversal results in Array.forEach<anonymous>
    // // (even though devtools knows we're in helperFunctions), so remove
    // // everything before the most recent operation started
    // args.stackFrames = args.stackFrames.slice(
    //   args.stackFrames.findIndex(frameString => frameString.includes("___op")) +
    //     1
    // );
    // args.stackFrames = args.stackFrames.filter(
    //   line => line !== "Error" && !line.includes("/helperFns.js")
    // );
    args.nativeFunctions = nativeFunctions;
    var log = new OperationLog(args);
    storeLog(log);

    // Normally we just store the numbers, but it's useful for
    // debugging to be able to view the log object
    // window["__debugAllLogs"] = window["__debugAllLogs"] || {};
    // window["__debugAllLogs"][log.index] = log;

    return log.index;
  }

  global["__debugLookupLog"] = function(logId, currentDepth = 0) {
    try {
      var log = JSON.parse(JSON.stringify(global["__debugAllLogs"][logId]));
      if (currentDepth < 3) {
        const newArgs = {};
        Object.keys(log.args).forEach(key => {
          newArgs[key] = global["__debugLookupLog"](
            log.args[key],
            currentDepth + 1
          );
        });
        log.args = newArgs;
      }

      return log;
    } catch (err) {
      return logId;
    }
  };

  var argTrackingInfo = null;

  global[
    functionNames.getFunctionArgTrackingInfo
  ] = function getArgTrackingInfo(index) {
    if (!argTrackingInfo) {
      console.log("no arg tracking info...");
      return null;
    }
    if (index === undefined) {
      return argTrackingInfo;
    }
    return argTrackingInfo[index];
  };

  global["addTrackingToArgumentsObject"] = function(
    argumentsObject,
    allFnArgTrackingValues
  ) {
    allFnArgTrackingValues.forEach((trackingValue, i) => {
      trackObjectPropertyAssignment(
        argumentsObject,
        i,
        trackingValue,
        createOperationLog({
          operation: operationTypes.arrayIndex,
          args: {},
          result: i,
          astArgs: {}
        })
      );
    });
    return argumentsObject;
  };

  global.getTrackingAndNormalValue = function(value) {
    return {
      normal: value,
      tracking: argTrackingInfo[0]
    };
  };

  // don't think this is needed, only used in demo with live code ediotr i think
  global.inspect = function(value) {
    global.inspectedValue = {
      normal: value,
      tracking: argTrackingInfo[0]
    };
  };

  initDomInspectionUI();

  global.fromJSInspect = function(value: any) {
    let logId;
    if (!argTrackingInfo && typeof value === "number") {
      logId = value;
    } else if (value instanceof Node) {
      postToBE("/inspectDOM", getHtmlNodeOperationLogMapping(value));
    } else {
      logId = argTrackingInfo[0];
    }
    postToBE("/inspect", {
      logId
    });
  };

  const objTrackingMap = new Map();
  window["__debugObjTrackingMap"] = objTrackingMap;
  function trackObjectPropertyAssignment(
    obj,
    propName,
    propertyValueTrackingValue,
    propertyNameTrackingValue = null
  ) {
    if (!propertyNameTrackingValue) {
      // debugger;
      console.count("no propertyNameTrackingValue");
    }
    // console.log("trackObjectPropertyAssignment", obj, propName, trackingValue)
    var objectPropertyTrackingInfo = objTrackingMap.get(obj);
    if (!objectPropertyTrackingInfo) {
      objectPropertyTrackingInfo = {};
      objTrackingMap.set(obj, objectPropertyTrackingInfo);
    }
    if (
      typeof propertyValueTrackingValue !== "number" &&
      !!propertyValueTrackingValue
    ) {
      debugger;
    }
    // "_" prefix because to avoid conflict with normal object methods,
    // e.g. there used to be problems when getting tracking value for "constructor" prop
    objectPropertyTrackingInfo["_" + propName] = {
      value: propertyValueTrackingValue,
      name: propertyNameTrackingValue
    };
  }
  function getObjectPropertyTrackingValue(obj, propName) {
    var objectPropertyTrackingInfo = objTrackingMap.get(obj);
    if (!objectPropertyTrackingInfo) {
      return null;
    }
    const trackingValues = objectPropertyTrackingInfo["_" + propName];
    if (!trackingValues) {
      return null;
    }
    return trackingValues.value;
  }
  window["getObjectPropertyTrackingValue"] = getObjectPropertyTrackingValue;

  var lastMemberExpressionObjectValue = null;
  var lastMemberExpressionObjectTrackingValue = null;
  global["getLastMemberExpressionObjectValue"] = function() {
    return lastMemberExpressionObjectValue;
  };

  global["getLastMemberExpressionObjectTrackingValue"] = function() {
    return lastMemberExpressionObjectTrackingValue;
  };

  var lastReturnStatementResult = null;

  const memoValues = {};
  global["__setMemoValue"] = function(key, value, trackingValue) {
    // console.log("setmemovalue", value)
    memoValues[key] = { value, trackingValue };
    setLastOpTrackingResult(trackingValue);
    validateTrackingValue(trackingValue);
    return value;
  };
  global["__getMemoArray"] = function(key) {
    const memo = memoValues[key];
    return [memo.value, memo.trackingValue];
  };
  global["__getMemoValue"] = function(key) {
    return memoValues[key].value;
  };
  global["__getMemoTrackingValue"] = function(key, value, trackingValue) {
    return memoValues[key].trackingValue;
  };

  function validateTrackingValue(trackingValue) {
    if (!!trackingValue && typeof trackingValue !== "number") {
      debugger;
      throw Error("eee");
    }
  }

  function setLastOpTrackingResult(trackingValue) {
    validateTrackingValue(trackingValue);
    lastOpTrackingResult = trackingValue;
  }

  var lastOpValueResult = null;
  var lastOpTrackingResult = null;
  let lastOpTrackingResultWithoutResetting = null;
  global[functionNames.doOperation] = function ___op(opName: string, ...args) {
    var value, trackingValue;

    var objArgs;
    var astArgs;
    var argNames = [];

    objArgs = args[0];
    astArgs = args[1];
    const loc = args[2];

    args;
    if (operationArrayArguments[opName]) {
      operationArrayArguments[opName].forEach(arrayArgName => {});
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
        global,
        loc,
        registerEvalScript(evalScript) {
          // store code etc for eval'd code
          evalScriptQueue.push(evalScript);
        },
        get lastOpTrackingResult() {
          return lastOpTrackingResult;
        },
        get lastOpTrackingResultWithoutResetting() {
          return lastOpTrackingResultWithoutResetting;
        },
        set extraArgTrackingValues(values) {
          extraTrackingValues = values;
        },
        get lastReturnStatementResult() {
          return lastReturnStatementResult;
        },
        set lastMemberExpressionResult([normal, tracking]) {
          lastMemberExpressionObjectValue = normal;
          lastMemberExpressionObjectTrackingValue = tracking;
        },
        set argTrackingInfo(info) {
          if (info) {
            info.forEach(trackingValue => validateTrackingValue(trackingValue));
          }
          argTrackingInfo = info;
        },
        get lastOperationType() {
          return lastOperationType;
        }
      };
      ret = operationsExec[opName](objArgs, astArgs, ctx);
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

    lastOpTrackingResultWithoutResetting = trackingValue;
    setLastOpTrackingResult(trackingValue);

    if (opName === "returnStatement") {
      // should ideally be in operations.ts
      // however: it can't be in exec because there
      // the trackingvalue doesn't exist yet!
      lastReturnStatementResult = [ret, trackingValue];
    }

    lastOperationType = opName;

    if (logQueue.length > 10000) {
      // avoid running out of memory
      sendLogsToServer();
    }

    return ret;
  };

  global[functionNames.getLastOperationValueResult] = function getLastOp() {
    var ret = lastOpValueResult;
    lastOpValueResult = null;
    return ret;
  };
  global[functionNames.getLastOperationTrackingResult] = function getLastOp() {
    validateTrackingValue(lastOpTrackingResult);
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

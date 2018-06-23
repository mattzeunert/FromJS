import OperationLog, { getOperationIndex } from "./OperationLog";
import getElementOperationLogMapping from "./getHtmlNodeOperationLogMapping";
import getHtmlNodeOperationLogMapping from "./getHtmlNodeOperationLogMapping";
import initDomInspectionUI from "./initDomInspectionUI";
import KnownValues from "./KnownValues";
import { ExecContext } from "./ExecContext";
import operations from "../operations";
import { SKIP_TRACKING, VERIFY, KEEP_LOGS_IN_MEMORY } from "../config";

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

  let knownValues = new KnownValues();

  function postToBE(endpoint, data) {
    const body = JSON.stringify(data);
    if (endpoint === "/storeLogs") {
      console.log(
        "Saving logs: ",
        data.logs.length,
        "Size: ",
        body.length / 1024 / 1024,
        "Mb"
      );
    }

    return fetch("http://localhost:BACKEND_PORT_PLACEHOLDER" + endpoint, {
      method: "POST",
      headers: new Headers({
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: accessToken
      }),
      body: body
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
    });

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
    if (SKIP_TRACKING) {
      return 1111;
    }
    var log = OperationLog.createAtRuntime(args, knownValues);
    storeLog(log);

    if (KEEP_LOGS_IN_MEMORY) {
      // Normally we just store the numbers, but it's useful for
      // debugging to be able to view the log object
      window["__debugAllLogs"] = window["__debugAllLogs"] || {};
      window["__debugAllLogs"][log.index] = log;
    }

    return log.index;
  }

  if (KEEP_LOGS_IN_MEMORY) {
    global["__debugLookupLog"] = function(logId, currentDepth = 0) {
      try {
        var log = JSON.parse(JSON.stringify(global["__debugAllLogs"][logId]));
        if (currentDepth < 12) {
          const newArgs = {};
          Object.keys(log.args).forEach(key => {
            newArgs[key] = global["__debugLookupLog"](
              log.args[key],
              currentDepth + 1
            );
          });
          log.args = newArgs;
        }
        if (currentDepth < 12 && log.extraArgs) {
          const newExtraArgs = {};
          Object.keys(log.extraArgs).forEach(key => {
            newExtraArgs[key] = global["__debugLookupLog"](
              log.extraArgs[key],
              currentDepth + 1
            );
          });
          log.extraArgs = newExtraArgs;
        }

        return log;
      } catch (err) {
        return logId;
      }
    };
  }

  var argTrackingInfo = null;

  global[
    functionNames.getFunctionArgTrackingInfo
  ] = function getArgTrackingInfo(index) {
    if (argTrackingInfo === null) {
      // this can happen when function is invoked without callexpression op,
      // e.g. when it's a callback argument to a native api call
      // TODO: return some kind of tracking value here ("untracked argument")
      // ideally also include a loc
      if (VERIFY) {
        console.log("no arg tracking info...");
      }
      return null;
    }
    if (index === undefined) {
      return argTrackingInfo;
    }
    return argTrackingInfo[index];
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

  global["__getHtmlNodeOperationLogMapping"] = getHtmlNodeOperationLogMapping;

  global.fromJSInspect = function(value: any) {
    let logId;
    if (!argTrackingInfo && typeof value === "number") {
      logId = value;
    } else if (value instanceof Node) {
      const mapping = getHtmlNodeOperationLogMapping(value);
      console.log({ mapping });
      postToBE("/inspectDOM", mapping);
    } else {
      logId = argTrackingInfo[0];
    }
    postToBE("/inspect", {
      logId
    });
  };

  function getTrackingPropName(propName) {
    // note: might be worth using Map instead and seeing how perf is affected
    if (typeof propName === "symbol") {
      return propName;
    } else {
      // "_" prefix because to avoid conflict with normal object methods,
      // e.g. there used to be problems when getting tracking value for "constructor" prop
      return "_" + propName;
    }
  }

  const objTrackingMap = new Map();
  window["__debugObjTrackingMap"] = objTrackingMap;
  function trackObjectPropertyAssignment(
    obj,
    propName,
    propertyValueTrackingValue,
    propertyNameTrackingValue = null
  ) {
    if (!propertyNameTrackingValue && VERIFY) {
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
    objectPropertyTrackingInfo[getTrackingPropName(propName)] = {
      value: propertyValueTrackingValue,
      name: propertyNameTrackingValue
    };
  }

  function getObjectPropertyTrackingValues(obj, propName) {
    var objectPropertyTrackingInfo = objTrackingMap.get(obj);
    if (!objectPropertyTrackingInfo) {
      return null;
    }
    const trackingValues =
      objectPropertyTrackingInfo[getTrackingPropName(propName)];
    if (!trackingValues) {
      return null;
    }
    return trackingValues;
  }

  function getObjectPropertyValueTrackingValue(obj, propName) {
    const trackingValues = getObjectPropertyTrackingValues(obj, propName);
    if (trackingValues === null) {
      return null;
    }
    return trackingValues.value;
  }
  window[
    "getObjectPropertyTrackingValue"
  ] = getObjectPropertyValueTrackingValue;

  function getObjectPropertyNameTrackingValue(obj, propName) {
    const trackingValues = getObjectPropertyTrackingValues(obj, propName);
    if (trackingValues === null) {
      return null;
    }
    return trackingValues.name;
  }

  window[
    "getObjectPropertyNameTrackingValue"
  ] = getObjectPropertyNameTrackingValue;

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

  const ctx: ExecContext = {
    operationTypes,
    getObjectPropertyTrackingValue: getObjectPropertyValueTrackingValue,
    getObjectPropertyNameTrackingValue,
    trackObjectPropertyAssignment,
    createOperationLog: function(args) {
      args.index = getOperationIndex();
      return createOperationLog(args);
    },
    knownValues,
    global,
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
    get lastReturnStatementResult() {
      return lastReturnStatementResult;
    },
    set lastReturnStatementResult(val) {
      lastReturnStatementResult = val;
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

  var lastOpValueResult = null;
  var lastOpTrackingResult = null;
  let lastOpTrackingResultWithoutResetting = null;
  global[functionNames.doOperation] = function ___op(
    opName: string,
    objArgs,
    astArgs,
    loc
  ) {
    var trackingValue;

    // if (operationArrayArguments[opName]) {
    //   operationArrayArguments[opName].forEach(arrayArgName => {});
    // }

    let logData: any = {
      operation: opName,
      args: objArgs,
      astArgs: astArgs,
      loc,
      index: getOperationIndex()
    };

    var ret;
    if (operationsExec[opName]) {
      ret = operationsExec[opName](objArgs, astArgs, ctx, logData);
    } else {
      console.log("unhandled op", opName);
      throw Error("oh no");
    }

    logData.result = ret;
    trackingValue = createOperationLog(logData);

    lastOpValueResult = ret;

    lastOpTrackingResultWithoutResetting = trackingValue;
    setLastOpTrackingResult(trackingValue);

    lastOperationType = opName;

    if (logQueue.length > 100000) {
      // avoid running out of memory
      sendLogsToServer();
    }

    return ret;
  };

  operationsExec = {};
  Object.keys(operations).forEach(opName => {
    const op = operations[opName];
    // The object creation in so many places is expensive
    // so some simple ops have a shorthand function that
    // is called instead of __op and calls through to __op
    if (op.shorthand) {
      global[op.shorthand.fnName] = op.shorthand.getExec(
        global[functionNames.doOperation]
      );
    }

    operationsExec[opName] = op.exec;
  });

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
  null,
  __OPERATION_ARRAY_ARGUMENTS__
);

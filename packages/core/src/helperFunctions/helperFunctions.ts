import OperationLog, { getOperationIndex } from "./OperationLog";
import getElementOperationLogMapping from "./getHtmlNodeOperationLogMapping";
import getHtmlNodeOperationLogMapping from "./getHtmlNodeOperationLogMapping";
import initDomInspectionUI from "./initDomInspectionUI";
import KnownValues from "./KnownValues";
import { ExecContext } from "./ExecContext";
import operations from "../operations";
import { SKIP_TRACKING, VERIFY, KEEP_LOGS_IN_MEMORY } from "../config";
import * as FunctionNames from "../FunctionNames";
import { initLogging, consoleCount, consoleLog, consoleError } from "./logging";
import { getStoreLogsWorker } from "./storeLogsWorker";
import * as OperationTypes from "../OperationTypes";
import { mapPageHtml } from "../mapPageHtml";
import mapInnerHTMLAssignment from "../operations/domHelpers/mapInnerHTMLAssignment";
import { CreateOperationLogArgs, ValueTrackingValuePair } from "../types";

const accessToken = "ACCESS_TOKEN_PLACEHOLDER";

var global = Function("return this")();
global.__didInitializeDataFlowTracking = true;

global.getElementOperationLogMapping = getElementOperationLogMapping;

let knownValues = new KnownValues();
// Make sure to use native methods in case browser methods get
// overwritten (e.g. NewRelic instrumentation does it)
// (only matters if we're not in the web worker)
let fetch = knownValues.getValue("fetch");

initLogging(knownValues);

const startTime = new Date();
setTimeout(checkDone, 20);
function checkDone() {
  if (typeof document === "undefined") {
    return;
  }
  const done =
    document.querySelector(".todo-list li") ||
    document.querySelector(".list-card-title");
  if (done) {
    const doneTime = new Date();
    consoleLog("#####################################");
    consoleLog("#####################################");
    consoleLog("#####################################");
    consoleLog("#####################################");
    consoleLog("#####################################");
    consoleLog("#####################################");
    consoleLog(
      "DONE",
      "timeTaken: " + (doneTime.valueOf() - startTime.valueOf()) / 1000 + "s"
    );
    worker.postMessage({ showDoneMessage: true });
  } else {
    setTimeout(checkDone, 20);
  }
}

function nodePost({ port, path, headers, bodyString }) {
  return new Promise(resolve => {
    // eval, otherwise webpack will replace it
    const https = eval(`require("http")`);

    const options = {
      hostname: "localhost",
      port: port,
      path: path,
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json"
        // "Content-Length": bodyString.length
      }
    };

    const req = https.request(options, res => {
      console.log(`statusCode: ${res.statusCode}`);

      res.on("data", d => {
        console.log(d.toString());
      });
      res.on("end", d => {
        resolve();
      });
    });

    req.on("error", error => {
      console.error(error);
    });

    req.write(bodyString);
    req.end();
  });
}

function makePostToBE({ accessToken, fetch }) {
  return function postToBE(endpoint, data, statsCallback = function(stats) {}) {
    const stringifyStart = new Date();
    const body = JSON.stringify(data);
    console.log("body len in mb", body.length / 1024 / 1024);
    const stringifyEnd = new Date();
    if (endpoint === "/storeLogs") {
      statsCallback({
        bodyLength: body.length,
        stringifyTime: stringifyEnd.valueOf() - stringifyStart.valueOf()
      });
    }

    let backendPort = "BACKEND_PORT_PLACEHOLDER";

    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: accessToken
    };
    let p;
    if (global.fromJSIsNode) {
      p = nodePost({
        port: backendPort,
        path: endpoint,
        bodyString: body,
        headers
      });
    } else {
      const url = "http://localhost:" + backendPort + endpoint;
      p = fetch(url, {
        method: "POST",
        headers: global.fromJSIsNode ? headers : new Headers(headers),
        body: body
      });
    }

    return p;
  };
}

const postToBE = makePostToBE({ accessToken, fetch });

let logQueue = [];
global["__debugFromJSLogQueue"] = () => logQueue;
let evalScriptQueue = [];
let worker: Worker | null = null;
// temporarily disable worker because i think lighthouse runs stuff in isolated envs
// and it means hundreds of workers get created rather than always using same one?
// try {
//   getStoreLogsWorker({
//   makePostToBE,
//   accessToken
// });
// }catch(err){
//   console.log("Create worker error, should be ok though", err.message)
// }

function sendLogsToServer() {
  if (logQueue.length === 0 && evalScriptQueue.length == 0) {
    return;
  }

  const data = {
    logs: logQueue,
    evalScripts: evalScriptQueue
  };

  if (worker) {
    // Doing this means the data will be cloned, but it seems to be
    // reasonably fast anyway
    // Creating the json and making the request in the main thread is super slow!
    console.time("postMessage");
    worker.postMessage(data);
    console.timeEnd("postMessage");
  } else {
    // consoleLog(
    //   "Can't create worker (maybe already inside a web worker?), will send request in normal thread"
    // );
    postToBE("/storeLogs", data);
  }

  logQueue = [];
  evalScriptQueue = [];
}
// If page laods quickly try to send data to BE soon, later on wait
// 1s between requests
setTimeout(sendLogsToServer, 200);
setTimeout(sendLogsToServer, 400);
setInterval(sendLogsToServer, 1000);
function remotelyStoreLog(log) {
  logQueue.push(log);
}

declare var __storeLog;

const storeLog =
  typeof __storeLog !== "undefined" ? __storeLog : remotelyStoreLog;

let lastOperationType = null;
function createOperationLog(args: CreateOperationLogArgs) {
  if (SKIP_TRACKING) {
    return 1111;
  }
  var log = OperationLog.createAtRuntime(args, knownValues);
  storeLog(log);

  if (KEEP_LOGS_IN_MEMORY) {
    // Normally we just store the numbers, but it's useful for
    // debugging to be able to view the log object
    global["__debugAllLogs"] = global["__debugAllLogs"] || {};
    global["__debugAllLogs"][log.index] = log;
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

global[FunctionNames.getGlobal] = function() {
  return global;
};

var argTrackingInfo = null;
var functionContextTrackingValue = null;

global[FunctionNames.getFunctionArgTrackingInfo] = function getArgTrackingInfo(
  index
) {
  if (!argTrackingInfo) {
    // this can happen when function is invoked without callexpression op,
    // e.g. when it's a callback argument to a native api call
    // TODO: return some kind of tracking value here ("untracked argument")
    // ideally also include a loc
    if (VERIFY) {
      consoleLog("no arg tracking info...");
    }
    return undefined;
  }
  if (index === undefined) {
    return argTrackingInfo;
  }
  return argTrackingInfo[index];
};
global[FunctionNames.getFunctionContextTrackingValue] = function() {
  return functionContextTrackingValue;
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

initDomInspectionUI("BACKEND_PORT_PLACEHOLDER");

global["__getHtmlNodeOperationLogMapping"] = getHtmlNodeOperationLogMapping;

global.fromJSInspect = function(value: any, charIndex: number) {
  let logId;
  if (!argTrackingInfo && typeof value === "number") {
    if (charIndex) {
      throw Error("Not supported yet");
    }
    logId = value;
  } else if (value instanceof Node) {
    const mapping = getHtmlNodeOperationLogMapping(value);
    consoleLog({ mapping });
    postToBE("/inspectDOM", { ...mapping, charIndex });
  } else {
    if (charIndex) {
      throw Error("Not supported yet");
    }
    logId = argTrackingInfo[0];
  }
  if (window["onFromJSInspect"]) {
    window["onFromJSInspect"]();
  }
  return postToBE("/inspect", {
    logId
  });
};

function getTrackingPropName(propName) {
  if (VERIFY) {
    try {
      if (parseFloat(propName) > 200) {
        consoleLog(
          "tracking array index greater than 200...1) perf issue, 2) possibly some kind of infinite loop"
        );
      }
    } catch (err) {}
  }
  // note: might be worth using Map instead and seeing how perf is affected
  if (typeof propName === "symbol") {
    return propName;
  } else {
    // "_" prefix because to avoid conflict with normal object methods,
    // e.g. there used to be problems when getting tracking value for "constructor" prop
    return "_" + propName;
  }
}

const objTrackingMap = new WeakMap();
global["__debugObjTrackingMap"] = objTrackingMap;
function trackObjectPropertyAssignment(
  obj,
  propName,
  propertyValueTrackingValue,
  propertyNameTrackingValue = null
) {
  if (!propertyNameTrackingValue && VERIFY) {
    consoleCount("no propertyNameTrackingValue");
  }
  var objectPropertyTrackingInfo = objTrackingMap.get(obj);
  if (!objectPropertyTrackingInfo) {
    objectPropertyTrackingInfo = {};
    objTrackingMap.set(obj, objectPropertyTrackingInfo);
  }
  if (
    typeof propertyValueTrackingValue !== "number" &&
    !!propertyValueTrackingValue
  ) {
    console.log("Tracking value is not a number:", propertyValueTrackingValue);
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
    return undefined;
  }
  const trackingValues =
    objectPropertyTrackingInfo[getTrackingPropName(propName)];
  if (!trackingValues) {
    return undefined;
  }
  return trackingValues;
}

function getObjectPropertyValueTrackingValue(obj, propName) {
  const trackingValues = getObjectPropertyTrackingValues(obj, propName);
  if (trackingValues === undefined) {
    return undefined;
  }
  return trackingValues.value;
}
global["getObjectPropertyTrackingValue"] = getObjectPropertyValueTrackingValue;

function getObjectPropertyNameTrackingValue(obj, propName) {
  const trackingValues = getObjectPropertyTrackingValues(obj, propName);
  if (trackingValues === undefined) {
    return undefined;
  }
  return trackingValues.name;
}

global[
  FunctionNames.getObjectPropertyNameTrackingValue
] = getObjectPropertyNameTrackingValue;

var lastMemberExpressionObjectValue = null;
var lastMemberExpressionObjectTrackingValue = null;
global[FunctionNames.getLastMemberExpressionObject] = function() {
  return [
    lastMemberExpressionObjectValue,
    lastMemberExpressionObjectTrackingValue
  ];
};

global[FunctionNames.getEmptyTrackingInfo] = function(type, loc) {
  let logData: any = {
    operation: "emptyTrackingInfo",
    args: {},
    runtimeArgs: { type },
    astArgs: {},
    loc,
    index: getOperationIndex()
  };

  return createOperationLog(logData);
};
global[FunctionNames.expandArrayForArrayPattern] = function(
  arr,
  loc,
  type,
  namedParamCount
) {
  if (!Array.isArray(arr)) {
    // e.g. Maps or arguments objects
    arr = Array.from(arr);
  }

  if (type === "forOf") {
    return arr.map(val => {
      return global[FunctionNames.expandArrayForArrayPattern](
        val,
        loc,
        "forOf_element",
        namedParamCount
      );
    });
  }
  const resultArr = [];
  const restResult = [];
  arr.forEach((value, i) => {
    const trackingValue = ctx.getObjectPropertyTrackingValue(arr, i);
    const newTrackingValue = ctx.createOperationLog({
      operation: ctx.operationTypes.arrayPattern,
      args: {
        value: [value, trackingValue]
      },
      astArgs: {},
      result: value,
      loc: loc
    });
    if (i < namedParamCount) {
      resultArr.push(value);
      resultArr.push(newTrackingValue);
    } else {
      restResult.push(value);
      ctx.trackObjectPropertyAssignment(
        restResult,
        i - namedParamCount,
        newTrackingValue
      );
    }
  });

  while (namedParamCount > resultArr.length / 2) {
    resultArr.push(undefined);
  }

  resultArr.push(
    global[FunctionNames.getEmptyTrackingInfo](
      "arrayPatternExpansion_rest",
      loc
    )
  );

  resultArr.push(restResult);
  return resultArr;
};
global[FunctionNames.expandArrayForSpreadElement] = function(arr) {
  if (!Array.isArray(arr)) {
    // Map or arguments object
    arr = Array.from(arr);
  }
  return arr.map((elem, i) => {
    return [elem, ctx.getObjectPropertyTrackingValue(arr, i)];
  });
};

const MAX_TRACKED_ARRAY_INDEX = 10;

var lastReturnStatementResult = null;

const memoValues = {};
global[FunctionNames.setMemoValue] = function(key, value, trackingValue) {
  memoValues[key] = { value, trackingValue };
  setLastOpTrackingResult(trackingValue);
  if (VERIFY) {
    validateTrackingValue(trackingValue);
  }
  return value;
};
global[FunctionNames.getMemoArray] = function(key) {
  const memo = memoValues[key];
  return [memo.value, memo.trackingValue];
};
global[FunctionNames.getMemoValue] = function(key) {
  return memoValues[key].value;
};
global[FunctionNames.getMemoTrackingValue] = function(key) {
  return memoValues[key].trackingValue;
};

function validateTrackingValue(trackingValue) {
  if (!!trackingValue && typeof trackingValue !== "number") {
    debugger;
    throw Error("eee");
  }
}

function setLastOpTrackingResult(trackingValue) {
  if (VERIFY) {
    validateTrackingValue(trackingValue);
  }

  lastOpTrackingResult = trackingValue;
}

const ctx: ExecContext = {
  operationTypes: OperationTypes,
  getObjectPropertyTrackingValue: getObjectPropertyValueTrackingValue,
  getObjectPropertyNameTrackingValue,
  trackObjectPropertyAssignment,
  hasInstrumentationFunction: typeof global["__fromJSEval"] === "function",
  createOperationLog: function(args) {
    args.index = getOperationIndex();
    return createOperationLog(args);
  },
  createArrayIndexOperationLog(index, loc) {
    if (index > MAX_TRACKED_ARRAY_INDEX) {
      // Just too much cost tracking this, and not much value
      return null;
    }
    return ctx.createOperationLog({
      operation: ctx.operationTypes.arrayIndex,
      result: index,
      loc: loc
    });
  },
  knownValues,
  global,
  registerEvalScript(evalScript) {
    // store code etc for eval'd code
    evalScriptQueue.push(evalScript);
  },
  objectHasPropertyTrackingData(obj) {
    return !!objTrackingMap.get(obj);
  },
  getEmptyTrackingInfo(type, loc) {
    return global[FunctionNames.getEmptyTrackingInfo](type, loc);
  },
  getCurrentTemplateLiteralTrackingValues() {
    return getCurrentTemplateLiteralTrackingValues();
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
    if (VERIFY && info) {
      info.forEach(trackingValue => validateTrackingValue(trackingValue));
    }
    argTrackingInfo = info;
  },
  set functionContextTrackingValue(tv: number) {
    functionContextTrackingValue = tv;
  },
  get lastOperationType() {
    return lastOperationType;
  },
  countOperations(fn) {
    let before = opExecCount;
    fn();
    return opExecCount - before;
  }
};

var lastOpValueResult = null;
var lastOpTrackingResult = null;
let lastOpTrackingResultWithoutResetting = null;

let opExecCount = 0;

function makeDoOperation(opName: string) {
  const opExec = operationsExec[opName];

  return function ___op(objArgs, astArgs, loc) {
    var trackingValue;

    let logData: any = {
      operation: opName,
      args: objArgs,
      astArgs: astArgs,
      loc,
      index: getOperationIndex()
    };

    var ret = opExec(objArgs, astArgs, ctx, logData);
    opExecCount++;

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
}

global[FunctionNames.doOperation] = function ___op(
  opName: string,
  objArgs,
  astArgs,
  loc
) {
  return global["__" + opName](objArgs, astArgs, loc);
};

const operationsExec = {};
Object.keys(operations).forEach(opName => {
  const op = operations[opName];
  operationsExec[opName] = op.exec;
  const doOpFunction = makeDoOperation(opName);

  // The object creation in so many places is expensive
  // so some simple ops have a shorthand function that
  // is called instead of __op and calls through to __op
  if (op.shorthand) {
    global[op.shorthand.fnName] = op.shorthand.getExec(doOpFunction);
  }

  global["__" + opName] = doOpFunction;
});

global[FunctionNames.getLastOperationValueResult] = function getLastOp() {
  var ret = lastOpValueResult;
  lastOpValueResult = null;
  return ret;
};
global[FunctionNames.getLastOperationTrackingResult] = function getLastOp() {
  if (VERIFY) {
    validateTrackingValue(lastOpTrackingResult);
  }
  var ret = lastOpTrackingResult;
  lastOpTrackingResult = null;
  return ret;
};
global[
  FunctionNames.getLastOperationTrackingResultWithoutResetting
] = function getLastOp() {
  if (VERIFY) {
    validateTrackingValue(lastOpTrackingResult);
  }
  return lastOpTrackingResult;
};

let currentTemplateLiteralIndex = 1;
let allTemplateLiteralTrackingValues = {};
function getCurrentTemplateLiteralTrackingValues() {
  if (!allTemplateLiteralTrackingValues[currentTemplateLiteralIndex]) {
    allTemplateLiteralTrackingValues[currentTemplateLiteralIndex] = [];
  }
  return allTemplateLiteralTrackingValues[currentTemplateLiteralIndex];
}
function resetCurrentTemplateLiteralTrackingValues() {
  allTemplateLiteralTrackingValues[currentTemplateLiteralIndex] = [];
}
global[FunctionNames.saveTemplateLiteralExpressionTrackingValue] = function(
  expressionValue
) {
  getCurrentTemplateLiteralTrackingValues().push({
    trackingValue: lastOpTrackingResultWithoutResetting,
    valueLength: (expressionValue + "").length
  });
  return expressionValue;
};
global[FunctionNames.exitTemplateLiteralAndGetTrackingValues] = function() {
  const ret = getCurrentTemplateLiteralTrackingValues();
  resetCurrentTemplateLiteralTrackingValues();
  currentTemplateLiteralIndex--;
  return ret;
};
global[FunctionNames.enterTemplateLiteral] = function() {
  currentTemplateLiteralIndex++;
};

global["__fromJSMaybeMapInitialPageHTML"] = function() {
  if (!global["__fromJSInitialPageHtml"]) {
    return;
  }
  if (global["__fromJSDidMapInitialPageHTML"]) {
    return;
  }

  const initialPageHtml = global["__fromJSInitialPageHtml"];

  if (document.body) {
    // If there's not head tag these items are put in the body and would
    // otherwise affect mapping, so remove them before we do the mapping
    document
      .querySelectorAll("[data-fromjs-remove-before-initial-html-mapping]")
      .forEach(el => el.remove());

    const initialHtmlTrackingValue = createOperationLog({
      operation: OperationTypes.initialPageHtml,
      index: getOperationIndex(),
      args: {},
      runtimeArgs: {
        url: location.href
      },
      result: initialPageHtml
    });

    mapPageHtml(
      document,
      initialPageHtml,
      initialHtmlTrackingValue,
      "initial page html"
    );

    global["__fromJSDidMapInitialPageHTML"] = true;
  }
};

global["__fromJSMaybeMapInitialPageHTML"]();

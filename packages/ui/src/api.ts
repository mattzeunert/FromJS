import appState from "./appState";
import {
  selectInspectedDomCharIndex,
  selectAndTraverse,
  setIsInspectingDemoApp
} from "./actions";
import FEOperationLog from "./FEOperationLogs";
import { debounce } from "lodash";

let backendPort = window["backendPort"];
let backendRoot = "http://localhost:" + backendPort;
const resolveStackFrameCache = {};
export function resolveStackFrame(operationLog) {
  if (resolveStackFrameCache[operationLog.index]) {
    return Promise.resolve(resolveStackFrameCache[operationLog.index]);
  }
  return fetch(backendRoot + "/resolveStackFrame", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    } as any,
    body: JSON.stringify({
      operationLog: operationLog
    })
  })
    .then(res => {
      if (res.status === 500) {
        throw "resolve stack error";
      } else {
        return res.json();
      }
    })
    .then(res => {
      resolveStackFrameCache[operationLog.index] = res;
      return res;
    });
}

export function inspectDomChar(charIndex) {
  console.time("inspectDomChar");
  return callApi("inspectDomChar", {
    charIndex
  }).then(function(re) {
    console.timeEnd("inspectDomChar");
    return re;
  });
}

export function callApi(endpoint, data) {
  const requestId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
  function finishRequest() {
    let apiRequestsInProgress = appState
      .get("apiRequestsInProgress")
      .filter(request => request.requestId !== requestId);
    appState.set("apiRequestsInProgress", apiRequestsInProgress);
  }
  appState.select("apiRequestsInProgress").push({ endpoint, data, requestId });
  return fetch(backendRoot + "/" + endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    } as any,
    body: JSON.stringify(data)
  })
    .then(r => r.json())
    .then(r => {
      if (r.err) {
        handleError(r.err);
        return Promise.reject();
      }
      finishRequest();
      return r;
    })
    .catch(e => {
      finishRequest();
      handleError(e.message);
    });
}

let errorQueue = [];
const handleError = function handleError(errorMessage) {
  console.log("handleerror", errorMessage);
  errorQueue.push(errorMessage);
  showErrorAlert();
};
let showErrorAlert = debounce(function() {
  alert("Errors: \n" + errorQueue.join("\n\n"));
  errorQueue = [];
}, 100);

function makeFEOperationLog(log) {
  if (log.args) {
    const newArgs = {};
    Object.keys(log.args).forEach(key => {
      const argLog = log.args[key];
      newArgs[key] =
        argLog && typeof argLog === "object" && makeFEOperationLog(argLog);
    });
    log.args = newArgs;
  }

  if (log.extraArgs) {
    const newExtraArgs = {};
    Object.keys(log.extraArgs).forEach(key => {
      const argLog = log.extraArgs[key];
      newExtraArgs[key] =
        argLog && typeof argLog === "object" && makeFEOperationLog(argLog);
    });
    log.extraArgs = newExtraArgs;
  }

  return new FEOperationLog(log);
}

export function loadSteps({ logId, charIndex }) {
  return callApi("traverse", { logId: logId, charIndex }).then(steps => {
    steps.steps.forEach(
      step => (step.operationLog = makeFEOperationLog(step.operationLog))
    );
    return steps;
  });
}

var exampleSocket = new WebSocket("ws://127.0.0.1:" + backendPort);

exampleSocket.onmessage = function(event) {
  console.log("websocket onmessage", event.data);
  const message = JSON.parse(event.data);
  if (message.type === "inspectOperationLog") {
    setIsInspectingDemoApp(message.isInspectingDemoApp);
    selectAndTraverse(message.operationLogId, 0);
  } else if (message.type === "inspectDOM") {
    handleDomToInspectMessage(message);
  }
};

function handleDomToInspectMessage(message) {
  appState.set("domToInspect", {
    outerHTML: message.html,
    charIndex: message.charIndex
  });
  setIsInspectingDemoApp(message.isInspectingDemoApp);
  selectInspectedDomCharIndex(message.charIndex);
}

fetch(backendRoot + "/inspect", {
  method: "GET",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json"
  }
} as any)
  .then(res => res.json())
  .then(r => {
    const { logToInspect } = r;
    setIsInspectingDemoApp(r.isInspectingDemoApp);
    selectAndTraverse(logToInspect, 0);
  });

fetch(backendRoot + "/inspectDOM", {
  method: "GET",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json"
  }
})
  .then(res => res.json())
  .then(r => {
    const { message } = r;
    if (!message || !message.html) {
      return;
    }
    handleDomToInspectMessage(message);
  });

import appState from "./appState";
import { selectInspectedDomCharIndex, selectAndTraverse } from "./actions";
import { debounce } from "lodash";
import OperationLog from "../../core/src/helperFunctions/OperationLog";

let backendPort = window["backendPort"];
let backendRoot = "http://localhost:" + backendPort;
const resolveStackFrameCache = {};
export function resolveStackFrame(operationLog) {
  const prettifyArg = appState.get("prettifyIfNoSourceMap") ? "/prettify" : "";
  const cacheKey = operationLog.index + prettifyArg;
  if (resolveStackFrameCache[cacheKey]) {
    return Promise.resolve(resolveStackFrameCache[cacheKey]);
  }
  return callApi(
    "resolveStackFrame/" + operationLog.loc + prettifyArg,
    {},
    { method: "GET" }
  ).then(res => {
    resolveStackFrameCache[cacheKey] = res;
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

export function callApi(endpoint, data, extraOptions: any = {}) {
  const requestId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
  function finishRequest() {
    let apiRequestsInProgress = appState
      .get("apiRequestsInProgress")
      .filter(request => request.requestId !== requestId);
    appState.set("apiRequestsInProgress", apiRequestsInProgress);
  }
  appState.select("apiRequestsInProgress").push({ endpoint, data, requestId });
  const requestDetails: any = Object.assign(
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      } as any
    },
    extraOptions
  );
  if (extraOptions.method !== "GET") {
    requestDetails.body = JSON.stringify(data);
  }
  return fetch(backendRoot + "/" + endpoint, requestDetails)
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
      console.log(
        "Request failed:" +
          " /" +
          endpoint +
          " " +
          JSON.stringify(requestDetails, null, 4)
      );
      handleError(e && e.message);
    });
}

let errorQueue = [];
const handleError = function handleError(errorMessage) {
  console.log("Handling API error: ", errorMessage);
  errorQueue.push(errorMessage);
  showErrorAlert();
};
let showErrorAlert = debounce(function() {
  alert("Errors: \n" + errorQueue.join("\n\n"));
  errorQueue = [];
}, 100);

export function makeFEOperationLog(log) {
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

  return new OperationLog(log);
}

export function loadSteps({ logId, charIndex }) {
  return callApi("traverse", { logId: logId, charIndex }).then(steps => {
    steps.steps.forEach(
      step => (step.operationLog = makeFEOperationLog(step.operationLog))
    );
    return steps;
  });
}

export function setEnableInstrumentation(enableInstrumentation) {
  appState.set("enableInstrumentation", enableInstrumentation);
  return callApi("setEnableInstrumentation", { enableInstrumentation });
}

var exampleSocket = new WebSocket("ws://127.0.0.1:" + backendPort);

exampleSocket.onmessage = function(event) {
  // console.log("websocket onmessage", event.data);
  const message = JSON.parse(event.data);

  if (message.type === "inspectOperationLog") {
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

  selectInspectedDomCharIndex(message.charIndex);
}

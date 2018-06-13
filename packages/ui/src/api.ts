import appState from "./appState";
import { selectInspectedDomCharIndex, selectAndTraverse } from "./actions";

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
  return fetch(backendRoot + "/" + endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    } as any,
    body: JSON.stringify(data)
  }).then(r => r.json());
}

export function loadSteps({ logId, charIndex }) {
  return fetch(backendRoot + "/traverse", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    } as any,
    body: JSON.stringify({ logId: logId, charIndex })
  }).then(res => res.json());
}

var exampleSocket = new WebSocket("ws://127.0.0.1:" + backendPort);

exampleSocket.onmessage = function(event) {
  console.log("websocket onmessage", event.data);
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

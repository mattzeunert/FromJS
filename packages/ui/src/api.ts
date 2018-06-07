import appState from "./appState";

let backendPort = window["backendPort"];
let backendRoot = "http://localhost:" + backendPort;
export function resolveStackFrame(operationLog) {
  return fetch(backendRoot + "/resolveStackFrame", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    } as any,
    body: JSON.stringify({
      stackFrameString: operationLog.stackFrames[0],
      operationLog: operationLog
    })
  }).then(res => {
    if (res.status === 500) {
      throw "resolve stack error";
    } else {
      return res.json();
    }
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
    appState.set("inspectionTarget", {
      logId: message.operationLogId,
      charIndex: 0
    });
  } else if (message.type === "inspectDOM") {
    console.log("inspectdom", event);
    appState.set("domToInspect", {
      outerHTML: message.html
    });
  }
};

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
    appState.set("inspectionTarget", {
      logId: logToInspect,
      charIndex: 0
    });
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
    const { html } = r;

    if (html) {
      appState.set("domToInspect", {
        outerHTML: html
      });
    }
  });

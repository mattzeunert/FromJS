let backendRoot = "http://localhost:" + window["backendPort"];
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

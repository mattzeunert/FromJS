const span = document.createElement("span");

document.querySelector("#app").appendChild(span);

fromJSInspect(document.querySelector("#app"));

window.testResult = __getHtmlNodeOperationLogMapping(
  document.querySelector("#app")
);

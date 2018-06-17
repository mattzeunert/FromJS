const span = document.createElement("span");
span.setAttribute("attr", "setAttribute");

document.querySelector("#app").appendChild(span);

fromJSInspect(document.querySelector("#app"));

window.testResult = __getHtmlNodeOperationLogMapping(
  document.querySelector("#app")
);

const span = document.createElement("span");
span.setAttribute("attr", "setAttribute");
span.innerHTML = "abc<b>innerHTML</b>";

const div = document.createElement("div");
div.textContent = "textContent";

const textNode = document.createTextNode("createTextNode");

const app = document.querySelector("#app");

app.appendChild(span);
app.appendChild(div);
app.insertAdjacentHTML(
  "afterbegin",
  "<div>insertAdjacentHTML1</div><div>insertAdjacentHTML2</div>"
);
app.appendChild(textNode);

fromJSInspect(app);

window.testResult = __getHtmlNodeOperationLogMapping(app);

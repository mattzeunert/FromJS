const span = document.createElement("span");
span.setAttribute("attr", "setAttribute");
span.innerHTML = "abc<b>innerHTML</b>";

const div = document.createElement("div");
div.textContent = "textContent";

const div2 = document.createElement("div");
div2.innerHTML = "<!-- COMMENT_IN_INNERTHML -->";

const textNode = document.createTextNode("createTextNode");

const app = document.querySelector("#app");

app.appendChild(span);
app.appendChild(div);
app.appendChild(div2);
app.insertAdjacentHTML(
  "afterbegin",
  "<div>insertAdjacentHTML1</div><div>insertAdjacentHTML2</div>"
);
app.appendChild(textNode);

fromJSInspect(app);

window.testResult = __getHtmlNodeOperationLogMapping(app);

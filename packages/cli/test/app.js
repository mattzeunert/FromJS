const app = document.querySelector("#app");

const span = document.createElement("span");
span.setAttribute("attr", "setAttribute");
span.innerHTML = "abc<b>innerHTML</b>";
app.appendChild(span);

const div = document.createElement("div");
div.textContent = "textContent";
app.appendChild(div);

const div2 = document.createElement("div");
div2.innerHTML = "<!-- COMMENT_IN_INNERTHML -->";
app.appendChild(div2);

const comment = document.createComment("createComment");
app.appendChild(comment);

const textNode = document.createTextNode("createTextNode");
app.appendChild(textNode);

const clonedSpan = span.cloneNode();
clonedSpan.innerHTML = "cloneNode";
clonedSpan.appendChild(comment.cloneNode());
clonedSpan.appendChild(textNode.cloneNode());
app.appendChild(clonedSpan);

app.insertAdjacentHTML(
  "afterbegin",
  "<div>insertAdjacentHTML1</div><div>insertAdjacentHTML2</div>"
);

fromJSInspect(app);

window.testResult = __getHtmlNodeOperationLogMapping(app);

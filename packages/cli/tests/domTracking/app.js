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

const textNodeWithTextAssignment = document.createTextNode("");
textNodeWithTextAssignment.nodeValue = "nodeNodeValueAssignment";
app.appendChild(textNodeWithTextAssignment);

const nodeForDeepCloning = document.createElement("div");
nodeForDeepCloning.innerHTML = "<div>deepClonedContent</div>";
const clonedSpan = span.cloneNode();
clonedSpan.innerHTML = "cloneNode";
clonedSpan.appendChild(comment.cloneNode());
clonedSpan.appendChild(textNode.cloneNode());
clonedSpan.appendChild(nodeForDeepCloning.cloneNode(true));
app.appendChild(clonedSpan);

app.insertAdjacentHTML(
  "afterbegin",
  "<div>insertAdjacentHTML1</div><div>insertAdjacentHTML2</div>"
);

const a = document.createElement("a");
a.href = "aHref";
app.appendChild(a);

const htmlToParse = "<div>DOMParser</div>";
const domParser = new DOMParser();
const parsedDoc = domParser.parseFromString(htmlToParse, "text/html");
app.appendChild(parsedDoc.body.children[0]);

const scriptTagContent = document.querySelector("#dataTag").textContent;
const dataDiv = document.createElement("div");
dataDiv.innerHTML = scriptTagContent;
app.appendChild(dataDiv);

fromJSInspect(app).then(() => {
  window.testResult = __getHtmlNodeOperationLogMapping(app);
});

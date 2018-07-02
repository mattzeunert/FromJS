let appHtml = '<div id="container">';
appHtml += "<div>";
appHtml += "<label>Name:</label>";
appHtml += '<input type="text" value="World" id="name" />';
appHtml += "</div>";
appHtml += '<div id="greeting"></div>';
appHtml += "</div>";

document.querySelector("#app").innerHTML = appHtml;

const containerDiv = document.querySelector("#container");
const nameInput = document.querySelector("#name");
const greetingDiv = document.querySelector("#greeting");

greetingDiv.setAttribute("style", "font-family: cursive; color: #942424;");

nameInput.addEventListener("keydown", updateGreeting);

updateGreeting();
fromJSInspect(
  containerDiv,
  containerDiv.outerHTML.indexOf(nameInput.value + "!</div>")
);

function updateGreeting() {
  const name = nameInput.value;
  const greeting = "Hello " + name + "!";
  greetingDiv.textContent = greeting;
}

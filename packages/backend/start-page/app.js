const time = new Date();
const message = "Now is " + time.toString();
fromJSInspect(message);
document.querySelector("#app").innerHTML = message;

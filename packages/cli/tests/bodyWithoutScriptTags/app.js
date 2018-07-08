document.addEventListener(
  "DOMContentLoaded",
  function() {
    const app = document.querySelector("#app");

    const div = document.createElement("div");
    div.innerHTML = "setByInnerHTML";
    app.appendChild(div);

    const script = document.createElement("script");
    script.src = "second.js";
    app.appendChild(script);
  },
  false
);

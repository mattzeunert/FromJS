export default function initDomInspectionUI() {
  if (typeof document === "undefined") {
    return;
  }
  let showDomInspector = false;
  const toggleInspectDomButton = document.createElement("div");
  let selectedElement = null;
  const selectedElementMarker = document.createElement("div");
  selectedElementMarker.style.border = "2px solid blue";

  function onBodyClick(e) {
    const el = e.target;
    if (el === toggleInspectDomButton) {
      return;
    }
    console.log({ el });
    global["fromJSInspect"](el);
    selectedElement = el;
    addHighlight(el);
    e.preventDefault();
    e.stopPropagation();

    function addHighlight(element) {
      const rect = element.getBoundingClientRect();
      selectedElementMarker.setAttribute(
        "style",
        "position: absolute; z-index: 10000000; pointer-events: none;border: 2px solid blue;" +
          "left: " +
          rect.left +
          "px;top: " +
          rect.top +
          "px;height: " +
          rect.height +
          "px;width: " +
          rect.width +
          "px;"
      );
    }
  }

  function toggleDomInspector() {
    if (showDomInspector) {
      selectedElementMarker.remove();
      document.body.removeEventListener("click", onBodyClick, true);
    } else {
      document.body.appendChild(selectedElementMarker);
      document.body.addEventListener("click", onBodyClick, true);
    }
    showDomInspector = !showDomInspector;
  }

  if (global["document"]) {
    if (global["document"]["body"]) {
      toggleInspectDomButton.innerHTML = "Enable DOM Inspector";
      toggleInspectDomButton.addEventListener("click", function() {
        toggleDomInspector();
        toggleInspectDomButton.innerHTML = showDomInspector
          ? "Disable DOM Inspector"
          : "Enable DOM Inspector";
      });
      toggleInspectDomButton.setAttribute(
        "style",
        "position: fixed;bottom: 0;right:0;padding: 10px;background: black; color: white;font-family: Arial;"
      );
      global["document"]["body"].appendChild(toggleInspectDomButton);
    }
  }
}

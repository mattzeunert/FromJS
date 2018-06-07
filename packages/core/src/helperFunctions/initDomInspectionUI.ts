export default function initDomInspectionUI() {
  if (typeof document === "undefined") {
    return;
  }
  var global = Function("return this")();
  let showDomInspector = false;
  const toggleInspectDomButton = document.createElement("div");
  let selectedElement = null;
  const selectedElementMarker = document.createElement("div");
  let previewedElement = null;
  const previewedElementMarker = document.createElement("div");

  function onSelectionEvent(e) {
    const el = e.target;
    if (el === toggleInspectDomButton) {
      return;
    }

    if (e.type == "click") {
      global["fromJSInspect"](el);
      selectedElement = el;
      addHighlight(el, "selected");
    } else if (e.type === "mouseenter") {
      previewedElement = el;
      if (previewedElement !== selectedElement) {
        addHighlight(el, "previewed");
      }
    } else if (e.type === "mouseleave") {
      previewedElement = null;
    }

    e.preventDefault();
    e.stopPropagation();
  }

  function addHighlight(element, highlightReason: "selected" | "previewed") {
    const rect = element.getBoundingClientRect();
    let marker =
      highlightReason === "selected"
        ? selectedElementMarker
        : previewedElementMarker;
    const color = highlightReason === "selected" ? "blue" : "green";
    const zIndex = highlightReason === "selected" ? 10000001 : 10000000;
    marker.setAttribute(
      "style",
      "position: absolute; z-index: " +
        zIndex +
        "; pointer-events: none;border: 2px solid " +
        color +
        ";" +
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

  function toggleDomInspector() {
    if (showDomInspector) {
      selectedElementMarker.remove();
      previewedElementMarker.remove();
      document.body.removeEventListener("click", onSelectionEvent, true);
      document.body.removeEventListener("mouseenter", onSelectionEvent, true);
      document.body.removeEventListener("mouseleave", onSelectionEvent, true);
    } else {
      document.body.appendChild(selectedElementMarker);
      document.body.appendChild(previewedElementMarker);
      document.body.addEventListener("click", onSelectionEvent, true);
      document.body.addEventListener("mouseenter", onSelectionEvent, true);
      document.body.addEventListener("mouseleave", onSelectionEvent, true);
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
        "position: fixed;bottom: 0;right:0;padding: 10px;background: black; color: white;font-family: Arial;cursor:pointer;"
      );
      global["document"]["body"].appendChild(toggleInspectDomButton);
    }
  }
}

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
      } else {
        removeHighlight("previewed");
      }
    } else if (e.type === "mouseleave") {
      previewedElement = null;
    }

    e.preventDefault();
    e.stopPropagation();
  }

  function getMarkerElementFromHighlightReason(
    highlightReason: "selected" | "previewed"
  ) {
    return highlightReason === "selected"
      ? selectedElementMarker
      : previewedElementMarker;
  }

  function addHighlight(element, highlightReason: "selected" | "previewed") {
    const rect = element.getBoundingClientRect();
    let marker = getMarkerElementFromHighlightReason(highlightReason);

    const color = highlightReason === "selected" ? "blue" : "green";
    const zIndex = highlightReason === "selected" ? 10000001 : 10000000;
    marker.setAttribute(
      "style",
      "position: absolute; display: block; z-index: " +
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

  function removeHighlight(highlightReason: "selected" | "previewed") {
    let marker = getMarkerElementFromHighlightReason(highlightReason);
    marker.style.display = "none";
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

  function init() {
    toggleInspectDomButton.innerHTML = "Enable DOM Inspector";
    toggleInspectDomButton.addEventListener("click", function() {
      toggleDomInspector();
      toggleInspectDomButton.innerHTML = showDomInspector
        ? "Disable DOM Inspector"
        : "Enable DOM Inspector";
    });
    toggleInspectDomButton.setAttribute(
      "style",
      "position: fixed;z-index: 100000000; bottom: 0;right:0;padding: 10px;background: #236fb1; color: white;font-family: Arial;cursor:pointer;font-size: 14px;"
    );
    global["document"]["body"].appendChild(toggleInspectDomButton);
  }

  if (global["document"]) {
    const interval = setInterval(function() {
      // Wait for HTML body
      if (global["document"]["body"]) {
        clearInterval(interval);
        init();
      }
    }, 1000);
  }
}

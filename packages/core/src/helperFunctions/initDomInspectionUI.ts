const inspectorWidth = "50vw";

export default function initDomInspectionUI(backendPort) {
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

  let waitForInitResolveFunction;
  const waitForInit = new Promise(
    resolve => (waitForInitResolveFunction = resolve)
  );
  window["onFromJSInspect"] = function() {
    waitForInit.then(() => {
      showInspectorUI();
    });
  };

  function onSelectionEvent(e) {
    const el = e.target;
    if (el === toggleInspectDomButton) {
      return;
    }

    if (e.type == "click") {
      global["fromJSInspect"](el);
      selectedElement = el;
      showInspectorUI();
      addHighlight(el, "selected");
    } else if (e.type === "mouseenter") {
      previewedElement = el;
      const inspectorContainer = document.querySelector(
        ".fromjs-inspector-container"
      );
      const isHoveringOverInspector =
        inspectorContainer &&
        (previewedElement === inspectorContainer ||
          inspectorContainer.contains(previewedElement));
      if (previewedElement !== selectedElement && !isHoveringOverInspector) {
        addHighlight(el, "previewed");
      } else {
        removeHighlight("previewed");
      }
    } else if (e.type === "mouseleave") {
      previewedElement = null;
      removeHighlight("previewed");
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

    const color = highlightReason === "selected" ? "#236fb1" : "#3a94e2";
    const backgroundColor =
      highlightReason === "selected"
        ? "rgba(35, 111, 177, .1)"
        : "rgba(41, 132, 205, .06)";
    const zIndex = highlightReason === "selected" ? 10000001 : 10000000;
    const boxTop =
      rect.top + document.body.scrollTop + document.documentElement.scrollTop; // note: this won't work well if inside another scrollable element
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
        boxTop +
        "px;height: " +
        rect.height +
        "px;width: " +
        rect.width +
        "px; background: " +
        backgroundColor +
        ";margin: 0;padding:0;"
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
      hideInspectorUI();
    } else {
      document.body.appendChild(selectedElementMarker);
      document.body.appendChild(previewedElementMarker);
      document.body.addEventListener("click", onSelectionEvent, true);
      document.body.addEventListener("mouseenter", onSelectionEvent, true);
      document.body.addEventListener("mouseleave", onSelectionEvent, true);
    }
    showDomInspector = !showDomInspector;
  }

  function updateToggleInspectDomButton() {
    let title;
    if (showDomInspector) {
      if (isShowingInspectorUI) {
        title = "Disable Inspector";
      } else {
        title = "Click to select DOM element";
      }
    } else {
      title = "Enable Inspector";
    }
    toggleInspectDomButton.innerHTML = title;
  }
  function init() {
    inspectorUI = createInspectorUI();
    hideInspectorUI();
    document.body.appendChild(inspectorUI);

    toggleInspectDomButton.innerHTML = "Enable Inspector";
    toggleInspectDomButton.addEventListener("click", function() {
      toggleDomInspector();
      updateToggleInspectDomButton();
    });
    toggleInspectDomButton.setAttribute(
      "style",
      "position: fixed;z-index: 100000000; bottom: 0;right:0;padding: 10px;background: #236fb1; color: white;font-family: Arial;cursor:pointer;font-size: 14px;margin: 0;width: auto;"
    );
    toggleInspectDomButton.setAttribute("id", "fromjs-inspect-dom-button");
    const body = global["document"]["body"];
    body.appendChild(toggleInspectDomButton);

    waitForInitResolveFunction();
  }

  let inspectorUI;
  let isShowingInspectorUI = false;

  function showInspectorUI() {
    if (isShowingInspectorUI) {
      return;
    }
    document.body.classList.add("showing-fromjs-inspector");
    const body = global["document"]["body"];
    inspectorUI.style.display = "block";
    toggleInspectDomButton.style.right = inspectorWidth;
    isShowingInspectorUI = true;
    updateToggleInspectDomButton();
  }

  function hideInspectorUI() {
    if (!isShowingInspectorUI) {
      return;
    }
    document.body.classList.remove("showing-fromjs-inspector");
    inspectorUI.style.display = "none";
    toggleInspectDomButton.style.right = "0px";
    isShowingInspectorUI = false;
    updateToggleInspectDomButton();
  }

  function createInspectorUI() {
    const inspectorUI = document.createElement("div");
    inspectorUI.classList.add("fromjs-inspector-container");
    const iframe = document.createElement("iframe");
    iframe.src = "http://localhost:" + backendPort;
    inspectorUI.appendChild(iframe);
    const inspectorStyles = document.createElement("style");

    inspectorStyles.textContent =
      `
      body.showing-fromjs-inspector {
         margin-right: ` +
      inspectorWidth +
      `;
      }
      .fromjs-inspector-container {
        border-left: 1px solid rgba(0,0,0,0.2);
        box-sizing: border-box;
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: ` +
      inspectorWidth +
      `;
        background: white;
        z-index: 20000000;
      }
      .fromjs-inspector-container iframe {
        width: ` +
      inspectorWidth +
      `;
        height: 100%;
        border: none;
      }
    `;
    inspectorUI.appendChild(inspectorStyles);

    return inspectorUI;
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

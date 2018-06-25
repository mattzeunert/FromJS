import appState from "./appState";
import { inspectDomChar, loadSteps } from "./api";

function traverse() {
  const inspectionTarget = appState.get("inspectionTarget");
  if (!inspectionTarget || !inspectionTarget.logId) {
    console.log("no inspection target!!");
  } else {
    console.time("Load Steps");
    loadSteps(inspectionTarget).then(r => {
      console.timeEnd("Load Steps");
      var steps = r.steps;
      console.log({ steps });

      appState.set("steps", steps);
    });
  }
}

export function selectAndTraverse(logId, charIndex, origin?) {
  appState.set("inspectionTarget", { logId, charIndex });
  if (origin === "traversalStep") {
    appState.set("collapseDomInspector", true);
  }
  traverse();
}

export function selectInspectedDomCharIndex(charIndex) {
  appState.set(["domToInspect", "charIndex"], charIndex);
  inspectDomChar(charIndex).then(({ logId, charIndex }) => {
    if (logId) {
      appState.set("inspectionTarget", { logId, charIndex });
      appState.set("collapseDomInspector", false);
      traverse();
    } else {
      appState.set("inspectionTarget", null);
      appState.set("collapseDomInspector", true);
    }
  });
}

export function expandDomInspector() {
  appState.set("collapseDomInspector", false);
}

export function collapseDomInspector() {
  appState.set("collapseDomInspector", true);
}

export function setIsInspectingDemoApp(isInspecting) {
  appState.set("isInspectingDemoApp", isInspecting);
}

export function enableShowFullDataFlow() {
  appState.set("showFullDataFlow", true);
}

export function disableShowFullDataFlow() {
  appState.set("showFullDataFlow", false);
}

export function setCollapseGetStartedIfHasData(collapse) {
  appState.set("collapseGetStartedIfHasData", collapse);
}

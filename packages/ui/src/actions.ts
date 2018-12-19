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
  if (origin === "traversalStep") {
    // this is bad! need to clean up how the state works at some point
    appState.set("domToInspect", null);
  }
  appState.set("inspectionTarget", { logId, charIndex });
  traverse();
}

export function selectInspectedDomCharIndex(charIndex) {
  appState.set(["domToInspect", "charIndex"], charIndex);
  inspectDomChar(charIndex).then(({ logId, charIndex }) => {
    if (logId) {
      appState.set("inspectionTarget", { logId, charIndex });
      traverse();
    } else {
      appState.set("inspectionTarget", null);
    }
  });
}

export function setIsInspectingDemoApp(isInspecting) {
  appState.set("isInspectingDemoApp", isInspecting);
}

export function toggleShowFullDataFlow(showFullDataFlow) {
  appState.set("showFullDataFlow", showFullDataFlow);
}

export function toggleShowDOMStep(showDOMStep) {
  appState.set("showDOMStep", showDOMStep);
}

export function setCollapseGetStartedIfHasData(collapse) {
  appState.set("collapseGetStartedIfHasData", collapse);
}

export function setPrettifyIfNoSourceMap(prettify) {
  appState.set("prettifyIfNoSourceMap", prettify);
  console.log("todo: update exisitng code now");
}

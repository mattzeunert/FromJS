import appState from "./appState";
import { inspectDomChar } from "./api";

export function selectAndTraverse(logId, charIndex) {
  appState.set("inspectionTarget", { logId, charIndex });
}

export function selectInspectedDomCharIndex(charIndex) {
  appState.set(["domToInspect", "charIndex"], charIndex);
  inspectDomChar(charIndex).then(({ logId, charIndex }) => {
    if (logId) {
      appState.set("inspectionTarget", { logId, charIndex });
    }
  });
}

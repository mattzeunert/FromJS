import appState from "./appState";

export function selectAndTraverse(logId, charIndex) {
  appState.set("inspectionTarget", { logId: 705162159, charIndex: 0 });
}

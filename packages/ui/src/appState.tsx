import * as Baobab from "baobab";

var appState = new Baobab({
  debugMode: false,
  steps: [],
  inspectionTarget: null,
  collapseDomInspector: true,
  isInspectingDemoApp: window["isInspectingDemoAppAtPageLoad"],
  showFullDataFlow: false
});
window["appState"] = appState;

export default appState;

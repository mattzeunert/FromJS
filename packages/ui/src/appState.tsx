import * as Baobab from "baobab";

var appState = new Baobab({
  debugMode: false,
  steps: [],
  inspectionTarget: null
});
window["appState"] = appState;

export default appState;

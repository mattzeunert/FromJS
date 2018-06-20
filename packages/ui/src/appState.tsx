import * as Baobab from "baobab";
var monkey = Baobab.monkey;

var appState = new Baobab({
  debugMode: false,
  steps: [],
  inspectionTarget: null,
  collapseDomInspector: true,
  isInspectingDemoApp: false,
  showFullDataFlow: false,
  apiRequestsInProgress: [],
  hasInProgressRequest: {
    traverse: monkey({
      cursors: {
        apiRequestsInProgress: ["apiRequestsInProgress"]
      },
      get: function({ apiRequestsInProgress }) {
        return apiRequestsInProgress.some(r => r.endpoint === "traverse");
      }
    })
  },
  hasInspectorData: monkey({
    cursors: {
      steps: ["steps"],
      inspectionTarget: ["inspectionTarget"]
    },
    get: function({ steps, inspectionTarget }) {
      return steps || inspectionTarget;
    }
  })
});
window["appState"] = appState;

export default appState;

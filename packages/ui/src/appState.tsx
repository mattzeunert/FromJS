import * as Baobab from "baobab";
var monkey = Baobab.monkey;

var appState = new Baobab({
  debugMode: false,
  steps: [],
  inspectionTarget: null,
  collapseDomInspector: true,
  isInspectingDemoApp: false,
  showFullDataFlow: false,
  prettifyIfNoSourceMap: false,
  enableInstrumentation: window["enableInstrumentation"],
  apiRequestsInProgress: [],
  collapseGetStartedIfHasData: true, // not used anymore i think
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
      return (
        (steps && steps.length > 0) ||
        (inspectionTarget && inspectionTarget.logId)
      );
    }
  }),
  // TODO: this should probably be top level state (and then we can implement undo/redo)
  inspectedString: monkey({
    cursors: {
      domToInspect: ["domToInspect"],
      steps: ["steps"]
    },
    get: function({ domToInspect, steps }) {
      if (domToInspect) {
        return {
          text: domToInspect.outerHTML,
          charIndex: domToInspect.charIndex,
          type: "dom"
        };
      } else if (steps.length > 0) {
        return {
          text: steps[0].operationLog.result.primitive + "",
          charIndex: steps[0].charIndex,
          logIndex: steps[0].operationLog.index,
          type: "js"
        };
      }
      return null;
    }
  })
});
window["appState"] = appState;

export default appState;

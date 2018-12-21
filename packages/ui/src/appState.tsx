import * as Baobab from "baobab";
import { setSelection } from "./actions";
var monkey = Baobab.monkey;

var appState = new Baobab({
  debugMode: false,
  steps: [],
  inspectionTarget: null,
  collapseDomInspector: true,
  isInspectingDemoApp: false,
  showFullDataFlow: false,
  showDOMStep: false,
  prettifyIfNoSourceMap: false,
  enableInstrumentation: window["enableInstrumentation"],
  apiRequestsInProgress: [],
  collapseGetStartedIfHasData: true, // not used anymore i think
  selectionHistory: [],
  canUndoSelection: monkey({
    cursors: {
      selectionHistory: ["selectionHistory"]
    },
    get: function({ selectionHistory }) {
      return selectionHistory.length > 2;
    }
  }),
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

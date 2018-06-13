import * as Baobab from "baobab";
import { loadSteps } from "./api";

var appState = new Baobab({
  debugMode: false,
  steps: [],
  inspectionTarget: null
});
window["appState"] = appState;

export default appState;

// maybe create effect.ts file for .on stuff?

appState.select("inspectionTarget").on("update", ({ target }) => {
  const inspectionTarget = target.get();
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
});

import compile from "./compile";

export function instrumentAndRun(code) {
  return new Promise(resolve => {
    code = `getTrackingAndNormalValue((function(){ ${code} })())`;
    compile(code).then(result => {
      var code = result.code;
      var result = eval(result.code);
      result.code = code.split("getTrackingAndNormalValue")[2]; // only the interesting code

      if (result.tracking) {
        // remove the extra fn arg from getTrackingAndNormalValue
        result.tracking = result.tracking.argTrackingValues[0];
        // remove the extra return statment from getTrackingAndNormalValue
        if (result.tracking) {
          result.tracking = result.tracking.argTrackingValues[0];
        }
      }

      resolve(result);
    });
  });
}

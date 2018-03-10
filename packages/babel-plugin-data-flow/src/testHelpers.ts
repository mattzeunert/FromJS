import compile from "./compile";

export function instrumentAndRun(code) {
  return new Promise(resolve => {
    code = `getTrackingAndNormalValue((function(){ ${code} })())`;
    compile(code).then(result => {
      // console.log(result.code);
      var code = result.code;
      var result = eval(result.code);
      result.code = code.split("getTrackingAndNormalValue")[2]; // only the interesting code
      // console.log(JSON.stringify(result.tracking, null, 4));

      if (result.tracking) {
        // remove the extra return statment from getTrackingAndNormalValue
        result.tracking = result.tracking.argTrackingValues[0];
      }

      resolve(result);
    });
  });
}

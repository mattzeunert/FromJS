import compile from "./compile";

export function instrumentAndRun(code) {
  return new Promise(resolve => {
    code = `getTrackingAndNormalValue((function(){ ${code} })())`;
    compile(code).then(result => {
      var code = result.code;
      var result = eval(result.code);
      result.code = code.split("* HELPER_FUNCTIONS_END */")[1]; // only the interesting code

      if (result.tracking) {
        // remove the extra fn arg/fnret/ret statement... from getTrackingAndNormalValue
        result.tracking =
          result.tracking.args.value[1].extraArgs.returnValue[1].args.returnValue[1];
      }

      resolve(result);
    });
  });
}

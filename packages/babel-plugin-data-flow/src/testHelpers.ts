import compile from "./compile";
import ServerInterface from "./ServerInterface"

const serverInterface = new ServerInterface()

export function instrumentAndRun(code) {
  return new Promise(resolve => {
    code = `getTrackingAndNormalValue((function(){ ${code} })())`;
    compile(code).then(result => {
      var code = result.code;

      const __storeLog = serverInterface.storeLog.bind(serverInterface)

      var result = eval(result.code);
      result.code = code.split("* HELPER_FUNCTIONS_END */")[1]; // only the interesting code

      if (result.tracking) {
        serverInterface.loadLog(result.tracking, (log) => {
          // remove the extra fn arg/fnret/ret statement... from getTrackingAndNormalValue
          result.tracking =
            log.args.value.extraArgs.returnValue.args.returnValue;
          resolve(result);
        })

      } else {
        resolve(result);
      }


    });
  });
}

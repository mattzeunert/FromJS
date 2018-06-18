import compile from "./compile";
import InMemoryLogServer from "./LogServer/InMemoryLogServer";
import OperationLog from "./helperFunctions/OperationLog";

const server = new InMemoryLogServer();

interface InstrumentAndRunResult {
  code: string;
  tracking?: OperationLog;
  normal?: any;
}

export function instrumentAndRun(code) {
  return new Promise<InstrumentAndRunResult>(resolve => {
    code = `getTrackingAndNormalValue((function(){ ${code} })())`;

    compile(code).then((compileResult: any) => {
      var code = compileResult.code;

      const __storeLog = server.storeLog.bind(server);

      var result: InstrumentAndRunResult;

      let testIsAsync = false;
      const asyncTest = function() {
        testIsAsync = true;
        return function finish(value) {
          result = {
            code: "",
            normal: value,
            tracking: global["__fnArg"](0)
          };
          finishRunning();
        };
      };
      result = eval(code);

      if (!testIsAsync) {
        finishRunning();
      }

      function finishRunning() {
        delete global["__didInitializeDataFlowTracking"];
        result.code = code.split("* HELPER_FUNCTIONS_END */")[1]; // only the interesting code

        if (result.tracking) {
          server.loadLog(
            result.tracking,
            (err, log) => {
              if (testIsAsync) {
                // remove functionArgument
                result.tracking = log.args.value;
                resolve(result);
              } else {
                // remove the extra fn arg/fnret/ret statement... from getTrackingAndNormalValue
                result.tracking =
                  log.args.value.extraArgs.returnValue.args.returnValue;
                // console.log(result.tracking)
                resolve(result);
              }
            },
            10
          );
        } else {
          resolve(result);
        }
      }
    });
  });
}

export { server };

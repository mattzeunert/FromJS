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

      // console.log(code.split("* HELPER_FUNCTIONS_END */")[1]);
      const __storeLog = server.storeLog.bind(server);
      var result: InstrumentAndRunResult = eval(code);

      delete global["__didInitializeDataFlowTracking"];
      result.code = code.split("* HELPER_FUNCTIONS_END */")[1]; // only the interesting code

      if (result.tracking) {
        server.loadLog(
          result.tracking,
          (err, log) => {
            if (err) {
              throw err;
            }
            // remove the extra fn arg/fnret/ret statement... from getTrackingAndNormalValue
            result.tracking = log.extraArgs.returnValue.args.returnValue;
            // console.log(result.tracking)
            resolve(result);
          },
          10
        );
      } else {
        resolve(result);
      }
    });
  });
}

export { server };

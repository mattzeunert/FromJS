import compile from "./compile";
import InMemoryLogServer from "./InMemoryLogServer";

const server = new InMemoryLogServer();

interface InstrumentAndRunResult {
  code: string;
  tracking?: any;
  normal?: any;
}

export function instrumentAndRun(code) {
  return new Promise<InstrumentAndRunResult>(resolve => {
    code = `getTrackingAndNormalValue((function(){ ${code} })())`;

    compile(code).then((compileResult: any) => {
      var code = compileResult.code;

      const __storeLog = server.storeLog.bind(server);

      var result: InstrumentAndRunResult = eval(code);
      result.code = code.split("* HELPER_FUNCTIONS_END */")[1]; // only the interesting code

      if (result.tracking) {
        server.loadLog(
          result.tracking,
          log => {
            // remove the extra fn arg/fnret/ret statement... from getTrackingAndNormalValue
            result.tracking =
              log.args.value.extraArgs.returnValue.args.returnValue;
            // console.log(result.tracking)
            resolve(result);
          },
          7
        );
      } else {
        resolve(result);
      }
    });
  });
}

export { server };

import compile, { CompilationResult } from "./compile";
import InMemoryLogServer from "./LogServer/InMemoryLogServer";
import OperationLog from "./helperFunctions/OperationLog";
import * as prettier from "prettier";

const inMemoryLocStore: any = {
  _locs: {},
  write(locs, callback) {
    Object.keys(locs).forEach(key => {
      this._locs[key] = locs[key];
    });
    if (callback) {
      callback();
    }
  },
  getLoc(locId, callback) {
    callback(this._locs[locId]);
  },
  async getLocAwaitable(locId) {
    return new Promise(resolve => {
      this.getLoc(locId, resolve);
    });
  }
};
const server = new InMemoryLogServer(inMemoryLocStore);

interface InstrumentAndRunResult {
  code: string;
  tracking?: OperationLog;
  normal?: any;
  logServer: InMemoryLogServer;
}

export function instrumentAndRun(
  code,
  outsideArgs = {},
  options = { logCode: false }
) {
  const { logCode } = options;
  return new Promise<InstrumentAndRunResult>(resolve => {
    code = `getTrackingAndNormalValue((function(){ ${code} })())`;

    compile(code).then(async (compileResult: CompilationResult) => {
      var code = compileResult.code;

      const relevantCode = code.split("* HELPER_FUNCTIONS_END */")[1];
      // console.log(relevantCode);

      server._locStore.write(compileResult.locs, function() {
        /* don't bother waiting since store is sync */
      });

      if (logCode) {
        console.log(
          prettier.format(code).split("* HELPER_FUNCTIONS_END */")[1]
        );
      }
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
        result.code = relevantCode; // only the interesting code

        result.logServer = server;

        if (result.tracking) {
          server.loadLog(
            result.tracking,
            (err, log) => {
              if (err) {
                throw err;
              }
              if (testIsAsync) {
                // remove functionArgument
                result.tracking = log!.args.value;
                resolve(result);
              } else {
                // remove the extra fn arg/fnret/ret statement... from getTrackingAndNormalValue
                result.tracking = log!.extraArgs.returnValue.args.returnValue;
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

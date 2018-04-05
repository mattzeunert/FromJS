import compile from "./compile";
import operations, { eachArgument } from "./operations";

var storedLogs = {}

export function instrumentAndRun(code) {
  return new Promise(resolve => {
    code = `getTrackingAndNormalValue((function(){ ${code} })())`;
    compile(code).then(result => {
      var code = result.code;

      function __storeLog(log) {
        storedLogs[log.index] = log
      }
      var result = eval(result.code);
      result.code = code.split("* HELPER_FUNCTIONS_END */")[1]; // only the interesting code

      function getLogAtIndex(index, fn) {
        var log = storedLogs[index]
        if (!log) {
          throw Error("log not found, index is: " + index + "... " + counter)
        }
        debugger
        fn(log)

      }
      function loadLog(log, fn) {
        let logIndex
        if (typeof log === "number") {
          logIndex = log
        } else {
          logIndex = log.index
        }
        console.log("loadlog", log)
        getLogAtIndex(logIndex, function (log) {
          updateEachOperationArgument(log, (log, update) => {
            if (!log) {
              update(log)
            } else {
              loadLog(log, l => update(l))
            }
          }, () => fn(log))
        })
      }
      console.log("rr", result.tracking)
      if (result.tracking) {
        loadLog(result.tracking, (log) => {
          // remove the extra fn arg/fnret/ret statement... from getTrackingAndNormalValue
          result.tracking =
            log.args.value.extraArgs.returnValue.args.returnValue;
          debugger
          resolve(result);
        })

      } else {
        resolve(result);
      }


    });
  });
}

function updateEachOperationArgument(log, updateFn, callback) {
  const promises = []
  eachArgument(log, (arg, argName, updateArg) => {
    promises.push(new Promise(resolve => {
      updateFn(arg, newValue => {
        updateArg(newValue)
        resolve()
      })
    }))
  })

  Promise.all(promises).then(callback)
}


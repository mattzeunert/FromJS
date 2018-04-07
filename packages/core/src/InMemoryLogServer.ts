import operations, { eachArgument } from "./operations";
import OperationLog from "./helperFunctions/OperationLog";

interface LogsObject {
  [key: string]: OperationLog;
}

export default class InMemoryLogServer {
  _storedLogs: LogsObject = {};
  storeLog(log) {
    this._storedLogs[log.index] = log;
  }
  getLog(index, fn) {
    var log = this._storedLogs[index];
    if (!log) {
      throw Error("log not found, index is: " + index);
    }
    fn(log);
  }
  loadLog(log, fn) {
    let logIndex;
    if (typeof log === "number") {
      logIndex = log;
    } else {
      logIndex = log.index;
    }
    this.getLog(logIndex, log => {
      updateEachOperationArgument(
        log,
        (log, update) => {
          if (!log) {
            update(log);
          } else {
            this.loadLog(log, l => update(l));
          }
        },
        () => fn(log)
      );
    });
  }
}

function updateEachOperationArgument(log, updateFn, callback) {
  const promises = [];
  eachArgument(log, (arg, argName, updateArg) => {
    promises.push(
      new Promise(resolve => {
        updateFn(arg, newValue => {
          updateArg(newValue);
          resolve();
        });
      })
    );
  });

  Promise.all(promises).then(callback);
}

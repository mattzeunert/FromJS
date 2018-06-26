import operations, { eachArgument } from "../operations";
import invokeIfFunction from "../invokeIfFunction";
import { LocStore } from "../LocStore";
export class LogServer {
  _locStore: LocStore;
  constructor(locStore) {
    this._locStore = locStore;
  }
  getLog(logIndex: number, cb: any) {}
  hasLog(logIndex: number, cb: (hasLog: boolean) => void) {
    this.loadLog(
      logIndex,
      function(err, log) {
        cb(!err);
      },
      0
    );
  }
  loadLog(log, fn, maxDepth = Number.POSITIVE_INFINITY, currentDepth = 0) {
    // console.count("load")
    let logIndex;
    if (typeof log === "number") {
      logIndex = log;
    } else {
      logIndex = log.index;
    }
    this.getLog(logIndex, (err, log) => {
      if (log === undefined) {
        debugger;
      }
      if (err) {
        fn(err, null);
        return;
      }

      const op = operations[log.operation];
      if (log.args === undefined && op.argNames) {
        // We sometimes remove the log if there's no data,
        // but we want to still be able to access the null value
        // by it's arg name.
        // E.g.: ret.args.returnValue
        log.args = Array.from(new Array(op.argNames.length)).map(
          i => undefined
        );
      }

      this._loadDataFromLoc(log).then(() => {
        if (Array.isArray(log.args)) {
          const args = log.args;
          const op = operations[log.operation];

          let argNames = invokeIfFunction(op.argNames, [log]);
          let argIsArray = invokeIfFunction(op.argIsArray, [log]);

          const newArgs = {}; // todo: don't do this here, do this when looking up the log on BE
          argNames.forEach((argName, i) => {
            const isArray = argIsArray && argIsArray[i];
            if (isArray) {
              args[i].forEach((arrayArg, argIndex) => {
                newArgs[argName + argIndex] = arrayArg;
              });
            } else {
              newArgs[argName] = args[i];
            }
          });
          log.args = newArgs;
        }

        if (currentDepth < maxDepth) {
          updateEachOperationArgument(
            log,
            (log, update) => {
              if (!log) {
                update(log);
              } else {
                this.loadLog(
                  log,
                  (err, l) => {
                    if (err) {
                      fn(err);
                      return;
                    }
                    update(l);
                  },
                  maxDepth,
                  currentDepth + 1
                );
              }
            },
            () => fn(null, log)
          );
        } else {
          fn(null, log);
        }
      });
    });
  }
  _loadDataFromLoc(log) {
    return new Promise(resolve => {
      if (log.operation === "stringLiteral") {
        this._locStore.getLoc(log.loc, loc => {
          log._result = loc.value;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
  async loadLogAwaitable(log, maxDepth) {
    return new Promise((resolve, reject) => {
      this.loadLog(
        log,
        (err, log) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(log);
        },
        maxDepth
      );
    });
  }
}

function updateEachOperationArgument(log, updateFn, callback) {
  const promises: Promise<any>[] = [];
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

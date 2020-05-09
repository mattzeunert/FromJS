import operations, { eachArgument } from "../operations";
import invokeIfFunction from "../invokeIfFunction";
import { LocStore } from "../LocStore";
import { MINIMIZE_LOG_DATA_SIZE } from "../config";
import OperationLog from "../helperFunctions/OperationLog";
import { getLongOperationName } from "../names";

export class LogServer {
  _locStore: LocStore;
  constructor(locStore) {
    this._locStore = locStore;
  }
  getLog(logIndex: number, cb: any) {}
  _getLog(logIndex: number, cb: any) {
    this.getLog(logIndex, (err, log) => {
      if (log) {
        log.operation = getLongOperationName(log.operation);
      }
      cb(err, log);
    });
  }
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
    let logIndex;

    if (typeof log === "number") {
      logIndex = log;
    } else {
      logIndex = log.index;
    }
    this._getLog(logIndex, (err, log) => {
      if (log === undefined) {
        debugger;
      }
      if (err) {
        fn(err, null);
        return;
      }

      this._loadDataFromLoc(log).then(() => {
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
        this._resolveLogArrayArgs(log);
        this._loadDataFromArguments(log).then(() => {
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
    });
  }

  _loadDataFromLoc(log: OperationLog) {
    return new Promise(resolve => {
      if (!MINIMIZE_LOG_DATA_SIZE) {
        resolve();
      }
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

  _resolveLogArrayArgs(log) {
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
  }

  _loadDataFromArguments(log) {
    return new Promise(resolve => {
      if (log._result === undefined) {
        this._getLogResult(log).then(res => {
          log._result = res;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  _getLogAndLoadLocData(logIndex, cb) {
    this._getLog(logIndex, (err, log) => {
      if (err) {
        cb(err);
      } else {
        this._loadDataFromLoc(log).then(() => {
          this._resolveLogArrayArgs(log);
          cb(null, log);
        });
      }
    });
  }

  _getLogResult(log: OperationLog) {
    return new Promise(resolve => {
      const tryGetResult = parentIndex => {
        // notes:
        // - we can't use getLog because the parent operation could also be an identifier
        // - we can't use loadlog because it will possibly load the current log again somewhere
        // in the history (not sure if that's possible, but i was getting some kind of inifinite loop)
        this._getLogAndLoadLocData(parentIndex, (err, parentLog) => {
          if (err) {
            throw err;
          }
          if (parentLog._result === undefined) {
            this._getLogResult(parentLog).then(resolve);
          } else {
            resolve(parentLog._result);
          }
        });
      };

      if (log._result === undefined) {
        // TODO: move this to operations.ts
        if (log.operation === "identifier") {
          tryGetResult(log.args.value);
        } else if (log.operation === "returnStatement") {
          tryGetResult(log.args.returnValue);
        } else if (log.operation === "memberExpression") {
          tryGetResult(log.extraArgs.propertyValue);
        } else {
          throw "no res... possibly because of MINIMIZA_LOG_DATA";
        }
      } else {
        resolve(log._result);
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

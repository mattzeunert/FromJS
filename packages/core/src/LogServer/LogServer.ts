import operations, { eachArgument } from "../operations";

export class LogServer {
  getLog(logIndex: number, cb: any) {}
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

import * as levelup from "levelup";
import * as leveldown from "leveldown";
import OperationLog from "../helperFunctions/OperationLog";
import { LogServer } from "./LogServer";

export default class LevelDBLogServer extends LogServer {
  db: any;
  constructor(dbPath: string) {
    super();
    this.db = levelup(leveldown(dbPath));
  }
  storeLog(log: OperationLog) {
    this.db.put(log.index.toString(), JSON.stringify(log), function(err) {
      if (err) return console.log("Ooops! (put)", err); // some kind of I/O error
    });
  }
  storeLogs(logs: OperationLog[], callback = function() {}) {
    var ops: any[] = [];

    logs.forEach(log => {
      ops.push({
        type: "put",
        key: log.index.toString(),
        value: JSON.stringify(log)
      });
    });

    this.db.batch(ops, function(err) {
      if (err) return console.log("Ooops!  - level db error (logs)", err);
      callback();
    });
  }
  getLog(
    index: number | string,
    fn: (err: any, log: OperationLog | null) => void
  ) {
    this.db.get(index.toString(), function(err, value) {
      if (err) {
        fn(err, null);
        return;
      }
      value = JSON.parse(value.toString());
      fn(null, new OperationLog(value));
    });
  }
}

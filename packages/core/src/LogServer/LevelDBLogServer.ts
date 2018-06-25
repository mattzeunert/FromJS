import * as levelup from "levelup";
import * as leveldown from "leveldown";
import OperationLog from "../helperFunctions/OperationLog";
import { LogServer } from "./LogServer";

export default class LevelDBLogServer extends LogServer {
  db: any;
  levelDownDb: any;
  constructor(dbPath: string) {
    super();
    this.levelDownDb = leveldown(dbPath);
    this.db = levelup(this.levelDownDb);
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

    // levelDownDb._batch vs db.batch:
    // _batch bypasses some validation code which should help performance a bit
    this.levelDownDb._batch(ops, function(err) {
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

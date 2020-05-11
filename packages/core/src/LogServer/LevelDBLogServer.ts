import * as levelup from "levelup";
import * as leveldown from "leveldown";
import OperationLog from "../helperFunctions/OperationLog";
import { LogServer } from "./LogServer";
import { LocStore } from "../LocStore";
import { cacheLevelDBGet } from "../cacheLevelDBGet";

export default class LevelDBLogServer extends LogServer {
  db: any;
  levelDownDb: any;
  _getCached: any;

  constructor(dbPath: string, locStore: LocStore) {
    super(locStore);
    this.levelDownDb = leveldown(dbPath);
    this.db = levelup(this.levelDownDb);
    this._getCached = cacheLevelDBGet(this.db);
  }
  storeLog(log: OperationLog) {
    this.db.put(log.index.toString(), JSON.stringify(log), function(err) {
      if (err) return console.log("Ooops! (put)", err); // some kind of I/O error
    });
  }
  storeLogs(logs: OperationLog[], callback = function() {}) {
    console.time("create ops");
    let types = {};
    // logs.forEach(log => {
    //   let operation = log["o"];
    //   types[operation] = types[operation] || 0;
    //   types[operation]++;
    // });
    // console.log(types);

    const ops = logs.map(log => {
      return {
        type: "put",
        key: log.index.toString(),
        value: JSON.stringify(log)
      };
    });
    console.timeEnd("create ops");

    // levelDownDb._batch vs db.batch:
    // _batch bypasses some validation code which should help performance a bit
    // ==> using batch for now, was getting napi_create_reference failed errors with _batch
    // ====> can't find the validation code any more, maybe it was removed?
    console.time("batch");
    this.levelDownDb.batch(ops, function(err) {
      if (err) return console.log("Ooops!  - level db error (logs)", err);
      console.timeEnd("batch");
      callback();
    });
  }

  getLog(
    index: number | string,
    fn: (err: any, log: OperationLog | null) => void
  ) {
    this._getCached(index.toString(), (err, value) => {
      if (err) {
        fn(err, null);
        return;
      }

      fn(null, value);
    });
  }
}

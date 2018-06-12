import * as levelup from "levelup";
import * as leveldown from "leveldown";
import OperationLog from "../helperFunctions/OperationLog";
import { LogServer } from "./LogServer";

export default class LevelDBLogServer extends LogServer {
  db: any;
  constructor() {
    super();
    this.db = levelup(leveldown("./mydb"));
  }
  storeLog(log: OperationLog) {
    this.db.put(log.index.toString(), JSON.stringify(log), function(err) {
      if (err) return console.log("Ooops! (put)", err); // some kind of I/O error
    });
  }
  getLog(
    index: number | string,
    fn: (err: any, log: OperationLog | null) => void
  ) {
    this.db.get(index.toString(), function(err, value) {
      if (err) {
        console.log("leveldb get err", err);
        fn(err, null);
        return;
      }
      value = JSON.parse(value.toString());
      fn(null, value);
    });
  }
}

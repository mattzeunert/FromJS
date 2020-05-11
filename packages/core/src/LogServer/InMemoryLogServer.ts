import OperationLog from "../helperFunctions/OperationLog";
import { LogServer } from "./LogServer";
import { LocStore } from "../LocStore";

interface LogsObject {
  [key: string]: string;
}

export default class InMemoryLogServer extends LogServer {
  _storedLogs: LogsObject = {};
  constructor(locStore: LocStore) {
    super(locStore);
  }
  storeLog(logIndex, logString) {
    this._storedLogs[logIndex] = logString;
  }
  storeLogs(logs, callback = function() {}) {
    logs.forEach(([logIndex, logString]) => this.storeLog(logIndex, logString));
    callback();
  }
  getLog(index: number, fn: (err: any, log: string | null) => void) {
    var log = this._storedLogs[index];
    if (!log) {
      fn(Error("log not found, index is: " + index), null);
      return;
    }

    fn(null, log);
  }
}

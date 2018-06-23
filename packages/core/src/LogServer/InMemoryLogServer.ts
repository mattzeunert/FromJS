import OperationLog from "../helperFunctions/OperationLog";
import { LogServer } from "./LogServer";

interface LogsObject {
  [key: string]: OperationLog;
}

export default class InMemoryLogServer extends LogServer {
  _storedLogs: LogsObject = {};
  storeLog(log) {
    this._storedLogs[log.index] = log;
  }
  storeLogs(logs, callback = function() {}) {
    logs.forEach(log => this.storeLog(log));
    callback();
  }
  getLog(index: number, fn: (err: any, log: OperationLog | null) => void) {
    var log = this._storedLogs[index];
    if (!log) {
      fn(Error("log not found, index is: " + index), null);
      return;
    }

    // deep clone log so we can modify it without affecting the original
    // possibly slow, can fix later
    log = new OperationLog(JSON.parse(JSON.stringify(log)));
    fn(null, log);
  }
}

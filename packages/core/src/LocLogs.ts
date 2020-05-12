import * as levelup from "levelup";
import * as leveldown from "leveldown";

// probably not a great way to store this stuff...

export class LocLogs {
  _db: any;
  _cachedGet: any;

  constructor(storePath: string) {
    this._db = levelup(leveldown(storePath));
  }

  getLogs(locId) {
    return new Promise(resolve => {
      this._db.get(locId, (err, value) => {
        if (value) {
          value = JSON.parse(value);
        } else {
          value = [];
        }
        resolve(value);
      });
    });
  }

  addLog(locId, logIndex) {
    return new Promise(resolve => {
      this._db.get(locId, (err, value) => {
        if (value) {
          value = JSON.parse(value);
        } else {
          value = [];
        }
        try {
          value.push(logIndex);
        } catch (err) {
          console.log(err, { value, locId });
        }
        this._db.put(locId, JSON.stringify(value), () => {
          resolve();
        });
      });
    });
  }

  addLogs(locId, logIndices) {
    return new Promise(resolve => {
      this._db.get(locId, (err, value) => {
        if (value) {
          value = JSON.parse(value);
        } else {
          value = [];
        }

        value.push.apply(value, logIndices);

        this._db.put(locId, JSON.stringify(value), () => {
          resolve();
        });
      });
    });
  }
}

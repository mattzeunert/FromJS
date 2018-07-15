import * as levelup from "levelup";
import * as leveldown from "leveldown";
import { cacheLevelDBGet } from "./cacheLevelDBGet";

export class LocStore {
  db: any;
  _cachedGet: any;

  constructor(storePath: string) {
    this.db = levelup(leveldown(storePath));
    this._cachedGet = cacheLevelDBGet(this.db);
  }

  write(locs, callback) {
    var ops: any[] = [];

    Object.keys(locs).forEach(key => {
      ops.push({
        type: "put",
        key: key,
        value: JSON.stringify(locs[key])
      });
    });

    this.db.batch(ops, function(err) {
      if (err) return console.log("Ooops!  - level db error", err);
      callback();
    });
  }

  getLoc(loc, callback) {
    this._cachedGet(loc, (err, value) => {
      if (err) {
        console.log(err);
        return;
      }
      callback(JSON.parse(value.toString()));
    });
  }
}

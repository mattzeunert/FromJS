import * as LRU from "lru-cache";

export function cacheLevelDBGet(db) {
  var cache = new LRU({
    max: 500,
    maxAge: 1000 * 60 * 60
  });
  return function getCached(index, cb) {
    if (cache.has(index)) {
      cb(null, cache.get(index));
      return;
    }

    db.get(index, (err, value) => {
      if (err) {
        cb(err);
        return;
      } else {
        value = value.toString();
        cache.set(index, value);
        cb(null, value);
      }
    });
  };
}

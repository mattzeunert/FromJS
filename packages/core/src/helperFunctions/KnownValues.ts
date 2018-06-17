export default class KnownValues {
  _knownValues: any = {};
  _knownValuesMap = new Map();

  constructor() {
    Object.assign(this._knownValues, {
      "String.prototype.slice": String.prototype.slice,
      "String.prototype.substr": String.prototype.substr,
      "String.prototype.replace": String.prototype.replace,
      "String.prototype.trim": String.prototype.trim,
      "Array.prototype.push": Array.prototype.push,
      "Array.prototype.join": Array.prototype.join,
      "JSON.parse": JSON.parse,
      "Object.keys": Object.keys,
      "Number.prototype.toString": Number.prototype.toString,
      "Boolean.prototype.toString": Boolean.prototype.toString,
      "Object.prototype.toString": Object.prototype.toString,
      "String.prototype.toString": String.prototype.toString,
      "Date.prototype.getMinutes": Date.prototype.getMinutes,
      "Date.prototype.getHours": Date.prototype.getHours,
      undefined: undefined,
      null: null
    });

    var global = Function("return this")();
    if (global["localStorage"]) {
      Object.assign(this._knownValues, {
        localStorage: global.localStorage,
        "localStorage.getItem": global.localStorage.getItem
      });
    }

    if (global["document"]) {
      const document = global.document;
      Object.assign(this._knownValues, {
        "document.createElement": document.createElement,
        "HTMLElement.prototype.setAttribute": HTMLElement.prototype.setAttribute
      });
    }

    Object.keys(this._knownValues).forEach(key => {
      this._knownValuesMap.set(this._knownValues[key], key);
    });
  }

  getName(value) {
    let knownValue = this._knownValuesMap.get(value);
    if (!knownValue) {
      knownValue = null;
    }
    return knownValue;
  }

  getValue(name: string) {
    return this._knownValues[name];
  }
}

export default class KnownValues {
  _knownValues: any = {};
  _knownValuesMap = new Map();

  constructor() {
    var global = Function("return this")();

    Object.assign(this._knownValues, {
      global: global,
      "String.prototype.slice": String.prototype.slice,
      "String.prototype.substr": String.prototype.substr,
      "String.prototype.substring": String.prototype.substring,
      "String.prototype.replace": String.prototype.replace,
      "String.prototype.trim": String.prototype.trim,
      "String.prototype.match": String.prototype.match,
      "String.prototype.split": String.prototype.split,
      "Array.prototype.push": Array.prototype.push,
      "Array.prototype.pop": Array.prototype.pop,
      "Array.prototype.join": Array.prototype.join,
      "Array.prototype.slice": Array.prototype.slice,
      "Array.prototype.splice": Array.prototype.splice,
      "Array.prototype.map": Array.prototype.map,
      "Array.prototype.filter": Array.prototype.filter,
      "Array.prototype.reduce": Array.prototype.reduce,
      "Array.prototype.concat": Array.prototype.concat,
      "Array.prototype.shift": Array.prototype.shift,
      "Array.prototype.unshift": Array.prototype.unshift,
      "Math.round": Math.round,
      "Math.min": Math.min,
      "Math.max": Math.max,
      Number: Number,
      parseFloat: parseFloat,
      "JSON.parse": JSON.parse,
      "JSON.stringify": JSON.stringify,
      "Object.keys": Object.keys,
      "Object.assign": Object.assign,
      "Object.entries": Object.entries,
      "Number.prototype.toString": Number.prototype.toString,
      "Boolean.prototype.toString": Boolean.prototype.toString,
      "Object.prototype.toString": Object.prototype.toString,
      "String.prototype.toString": String.prototype.toString,
      "Date.prototype.getMinutes": Date.prototype.getMinutes,
      "Date.prototype.getHours": Date.prototype.getHours,
      encodeURIComponent: encodeURIComponent,
      decodeURIComponent: decodeURIComponent,
      undefined: undefined,
      null: null,
      "Promise.prototype.then": Promise.prototype.then,
      "Promise.prototype.catch": Promise.prototype.catch,
      "Function.prototype.call": Function.prototype.call,
      "Function.prototype.apply": Function.prototype.apply,
      "console.log": console.log,
      "console.warn": console.warn,
      "console.count": console.count,
      "console.error": console.error
    });

    if (global["localStorage"]) {
      Object.assign(this._knownValues, {
        localStorage: global.localStorage,
        "localStorage.getItem": global.localStorage.getItem
      });
    }
    if (global["fetch"]) {
      Object.assign(this._knownValues, {
        fetch: fetch,
        "Response.prototype.json": Response.prototype.json,
        "Response.prototype.text": Response.prototype.text
      });
    }
    if (global["XMLHttpRequest"]) {
      Object.assign(this._knownValues, {
        "XMLHttpRequest.prototype.open": XMLHttpRequest.prototype.open
      });
    }

    if (global["document"]) {
      const document = global.document;
      Object.assign(this._knownValues, {
        "document.createElement": document.createElement,
        "document.createTextNode": document.createTextNode,
        "document.createComment": document.createComment,
        "document.importNode": document.importNode,
        "HTMLElement.prototype.setAttribute":
          HTMLElement.prototype.setAttribute,
        "HTMLElement.prototype.insertAdjacentHTML":
          HTMLElement.prototype.insertAdjacentHTML,
        "HTMLElement.prototype.cloneNode": HTMLElement.prototype.cloneNode,
        "DOMParser.prototype.parseFromString":
          DOMParser.prototype.parseFromString,
        // Added this as a special case to make reading value in React work,
        // React gets the getter from the property descriptor and then
        // runs getter.call() to get the input element's value
        HTMLInputElementValueGetter: Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          "value"
        )!.get
      });
    }

    Object.keys(this._knownValues).forEach(key => {
      this._knownValuesMap.set(this._knownValues[key], key);
    });
  }

  getName(value) {
    let knownValue = this._knownValuesMap.get(value);
    if (!knownValue) {
      knownValue = undefined;
    }
    return knownValue;
  }

  getValue(name: string) {
    return this._knownValues[name];
  }
}

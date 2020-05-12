let nodeRequire;
if (global["fromJSIsNode"]) {
  // note: require is a different value in each file
  nodeRequire = eval("require");
}

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
      parseFloat: parseFloat,
      Date: Date,
      "JSON.parse": JSON.parse,
      "JSON.stringify": JSON.stringify,
      "Object.keys": Object.keys,
      "Object.assign": Object.assign,
      "Object.entries": Object.entries,
      "Boolean.prototype.toString": Boolean.prototype.toString,
      "Object.prototype.toString": Object.prototype.toString,
      "Date.prototype.getMinutes": Date.prototype.getMinutes,
      "Date.prototype.getHours": Date.prototype.getHours,
      encodeURIComponent: encodeURIComponent,
      decodeURIComponent: decodeURIComponent,
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

    if (global.fromJSIsNode) {
      Object.assign(this._knownValues, {
        "fs.readFileSync": require("fs").readFileSync,
        "fs.writeFileSync": require("fs").writeFileSync,
        "fs.writeFile": require("fs").writeFile
      });
    }

    [
      {
        obj: String.prototype,
        name: "String.prototype"
      },
      {
        obj: Number.prototype,
        name: "Number.prototype"
      },
      {
        obj: Object.prototype,
        name: "Object.prototype"
      },
      {
        obj: RegExp.prototype,
        name: "RegExp.prototype"
      },
      {
        obj: Math,
        name: "Math"
      },
      {
        obj: Date.prototype,
        name: "Date.prototype"
      }
    ].forEach(item => {
      Object.getOwnPropertyNames(item.obj).forEach(propertyName => {
        let value = item.obj[propertyName];

        // Only knownValue if not e.g. null/undefined
        // Otherwise every time undefined appears we'd say it's RegExp.protoype.unicode
        if (value) {
          this._knownValues[item.name + "." + propertyName] = value;
        }
      });
    });

    try {
      if (global["localStorage"]) {
        Object.assign(this._knownValues, {
          localStorage: global.localStorage,
          "localStorage.getItem": global.localStorage.getItem
        });
      }
    } catch (err) {
      // e.g. on about:blank just trying to access local storage failes I think
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
    if (global["location"]) {
      Object.assign(this._knownValues, {
        location: location
      });
    }
    if (global["history"]) {
      Object.assign(this._knownValues, {
        history: history
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
    // Check for require
    // can't just check with === because require is a unique value in each file
    if (
      typeof value === "function" &&
      nodeRequire &&
      value.main === nodeRequire.main
    ) {
      knownValue = "require";
    }
    return knownValue;
  }

  getValue(name: string) {
    return this._knownValues[name];
  }
}

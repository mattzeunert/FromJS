import _ from "underscore"
import untracedToString from "./untracedToString"

export default function Origin(opts){
    var error = opts.error;
    if (!error) {
        Error.stackTraceLimit = 500;
        error = new Error();
    }

    this.action = opts.action;
    this.value = ensureValueIsString(opts.value)
    this.error = error;

    if (opts.inputValues.length > 0) {
        this.inputValues = opts.inputValues.map(function(iv){
            return getUsableInputValue(iv, error)
        })
    }

    if (opts.extraCharsAdded) {
        this.extraCharsAdded = opts.extraCharsAdded
    }

    if (opts.inputValuesCharacterIndex) {
        this.inputValuesCharacterIndex = opts.inputValuesCharacterIndex
    }
    if (opts.offsetAtCharIndex){
        this.offsetAtCharIndex = opts.offsetAtCharIndex
        if (this.offsetAtCharIndex.length == 0){
            debugger
        }
    }

    if (opts.isHTMLFileContent) {
        this.isHTMLFileContent = opts.isHTMLFileContent
    }
    if (opts.valueItems) {
        this.valueItems = opts.valueItems
    }
}

function ensureValueIsString(value){
    if (typeof value === "number") {
        value = window.nativeNumberToString.call(value)
    } else {
        value = value.toString();

        if (typeof value !== "string") {
            // not sure exactly when this happens, something like
            // this maybe?
            // a = [[333], 55] + [444]
            value = value.toString();
        }
    }
    return value;
}

function getUsableInputValue(inputValue, error){
    if (typeof inputValue === "undefined") {
       return new Origin({
           action: "Undefined",
           inputValues: [],
           value: "undefined", // would rather not store a whole function reference
           error: error
       })
    }
    if (inputValue.isFromJSOriginObject){
        return inputValue
    }
    if (inputValue.origin && inputValue.origin.isFromJSOriginObject){
        return inputValue.origin
    }
    if (inputValue instanceof Element){
        return inputValue
    }
    if (typeof inputValue === "number") {
        return new Origin({
            action: "Number",
            inputValues: [],
            value: inputValue,
            error: error
        })
    }
    if (typeof inputValue === "string") {
        return new Origin({
            action: "String",
            inputValues: [],
            value: inputValue,
            error: error
        })
    }
    if (typeof inputValue === "boolean") {
        return new Origin({
            action: "Boolean",
            inputValues: [],
            value: inputValue,
            error: error
        })
    }
    if (typeof inputValue === "object") {
        return new Origin({
            action: "Object",
            inputValues: [],
            value: toString(inputValue), // would rather not store a whole obj reference
            error: error
        })
    }
    if (typeof inputValue === "function") {
       return new Origin({
           action: "Function",
           inputValues: [],
           value: toString(inputValue), // would rather not store a whole function reference
           error: error
       })
   }


    debugger
    return new Origin({
        action: "Unknown Thing",
        inputValues: [],
        value: toString(inputValue),
        error: error
    })
}

// easier for tests to handle / simulate than instanceof check
Object.defineProperty(Origin.prototype, "isFromJSOriginObject", {
    value: true
})

Origin.prototype.getId = function(){
    if (this._id === undefined) {
        this._id = _.uniqueId()
    }
    return this._id;
}

Object.defineProperty(Origin.prototype, "extraCharsAdded", {
    value: 0,
    writable: true
})

Object.defineProperty(Origin.prototype, "inputValues", {
    value: [],
    writable: true
})

Origin.prototype.getStackFrames = function(){
    return this.error.stack.split("\n").filter(function(frame){
        if (frame.indexOf("fromjs-internals/from.js") !== -1) {
            return false;
        }
        if (frame.indexOf("chrome-extension://") !== -1 &&
            (frame.indexOf("from.js") !== -1) || frame.indexOf("injected.js") !== -1) {
            return false;
        }
        if (frame.indexOf("/base/src/test-setup.spec.js") !== -1) {
            return false
        }
        if (frame.indexOf("chrome-extension-from-string/from.js") !== -1) {
            return false;
        }
        if (frame.indexOf("http://localhost:8080/dist/from.js") !== -1) {
            return false;
        }
        if (frame.indexOf("webpack://") !== -1) {
            // loading from webpack-dev-server
            return false;
        }
        if (frame.indexOf("(native)") !== -1) {
            return false;
        }
        if (frame === "Error"){
            return false;
        }
        return true
    });
}

Origin.prototype.serialize = function(){
    var serialized = {...this}
    if (!serialized.inputValues) {
        serialized.inputValues = [];
    }

    serialized.inputValues =  serialized.inputValues.map(function(inputValue){
        inputValue = {...inputValue}
        // prevent tree from sprawling arbitrarily deep
        inputValue.inputValues = [];
        // Some input values can be elements, (which is wrong and should change at some point)
        // but for now avoid passing elements on to iframe.
        inputValue.__elOrigin = undefined
        return inputValue
    })

    serialized.stack = this.getStackFrames();
    serialized.id = this.getId();

    return serialized;
}

window.Origin = Origin

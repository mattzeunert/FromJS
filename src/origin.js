import _ from "underscore"

// Storing lots of arrays costs lots of memory, and
// since many inputValues arrays are empty we can just
// re-use the same array every time.
var emptyInputValuesArray = []
Object.freeze(emptyInputValuesArray)

var originsById = {}

export function getOriginById(originId) {
    return originsById[originId]
}

export default function Origin(opts){
    var inputValues = opts.inputValues.map(function(inputValue){
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
                action: "Untracked number",
                inputValues: [],
                value: inputValue,
                error: opts.error
            })
        }
        if (typeof inputValue === "string") {
            return new Origin({
                action: "Untracked string",
                inputValues: [],
                value: inputValue,
                error: opts.error
            })
        }
        if (inputValue.origin === undefined)debugger
        return inputValue.origin
    })

    this.id = _.uniqueId();
    originsById[this.id] = this

    this.action = opts.action;
    if (inputValues.length === 0) {
        inputValues = emptyInputValuesArray
    }
    this.inputValues = inputValues;

    this.extraCharsAdded = 0;
    if (opts.extraCharsAdded) {
        this.extraCharsAdded = opts.extraCharsAdded
    }

    // easier for tests to handle / simulate
    this.isFromJSOriginObject = true;

    this.inputValuesCharacterIndex = opts.inputValuesCharacterIndex
    this.offsetAtCharIndex = opts.offsetAtCharIndex
    if (this.offsetAtCharIndex && this.offsetAtCharIndex.length == 0){
        debugger
    }

    this.isHTMLFileContent = opts.isHTMLFileContent

    var value = opts.value;
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
    this.value = value

    this.valueOfEl = opts.valueOfEl
    this.valueItems = opts.valueItems
    Error.stackTraceLimit = 500;

    if (opts.error) {
        this.error = opts.error;
    } else {
        this.error = new Error()
    }


}

Origin.prototype.getValue = function(){
    if (this.valueOfEl) {
        return this.valueOfEl.outerHTML
    }
    return this.value
}

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
    return serialized;
}

window.Origin = Origin

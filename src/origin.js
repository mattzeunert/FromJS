export default function Origin(opts){
    var inputValues = opts.inputValues.map(function(inputValue){
        if (inputValue instanceof Origin){
            return inputValue
        }
        if (inputValue.origin instanceof Origin){
            return inputValue.origin
        }
        if (inputValue instanceof Element){
            return inputValue
        }
        if (typeof inputValue === "number") {
            return new Origin({
                action: "Untracked number",
                inputValues: [],
                value: inputValue.toString()
            })
        }
        if (typeof inputValue === "string") {
            return new Origin({
                action: "Untracked string",
                inputValues: [],
                value: inputValue
            })
        }
        return inputValue.origin
    })

    this.action = opts.action;
    this.inputValues = inputValues;

    this.extraCharsAdded = 0;
    if (opts.extraCharsAdded) {
        this.extraCharsAdded = opts.extraCharsAdded
    }

    this.inputValuesCharacterIndex = opts.inputValuesCharacterIndex
    this.offsetAtCharIndex = opts.offsetAtCharIndex

    this.isHTMLFileContent = opts.isHTMLFileContent

    this.value = opts.value && opts.value.toString();
    this.valueOfEl = opts.valueOfEl
    this.valueItems = opts.valueItems
    this.actionDetails = opts.actionDetails;
    Error.stackTraceLimit = 500;

    this.error = new Error()

}

Origin.prototype.getValue = function(){
    if (this.valueOfEl) {
        return this.valueOfEl.outerHTML
    }
    return this.value
}

Origin.prototype.getStackFrames = function(){
    return this.error.stack.split("\n").filter(function(frame){
        if (frame.indexOf("/fromjs-internals/from.js") !== -1) {
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

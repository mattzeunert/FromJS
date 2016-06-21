require("./compile")
require("./getVisData")
require("./stackframe")
require("./source-map")

function processElementsAvailableOnInitialLoad(){
    var els = document.querySelectorAll("*")

    els = Array.prototype.slice.apply(els)
    els.forEach(function(el){
        el.__elOrigin = [];
        var initialHtmlOrigin = {
            value: el.innerHTML,
            action: "content from initial html",
            inputValues: []
        }
        var children = Array.prototype.slice.apply(el.children)
        children.forEach(function(child){
            initialHtmlOrigin.inputValues.push(child)
        })
        el.__elOrigin.push(initialHtmlOrigin)

        el.__elOriginCreation = makeOrigin({
            action: "initial html",
            inputValues: [],
            value: el.outerHTML
        })
    })
}
processElementsAvailableOnInitialLoad();

function isArray(val){
    return val.length !== undefined && val.map !== undefined;
}

function StringTraceString(options){
    this.origin = options.origin
    this.value = options.value
    this.isStringTraceString = true
}
// getOwnPropertyNames instead of for loop b/c props aren't enumerable
Object.getOwnPropertyNames(String.prototype).forEach(function(propertyName){
    if (propertyName === "toString") { return }
    // can't use .apply on valueOf function (" String.prototype.valueOf is not generic")
    if (propertyName === "valueOf") { return }
    if (typeof String.prototype[propertyName] === "function") {
        StringTraceString.prototype[propertyName] = function(){
            var oldValue = this;
            var args = unstringTracifyArguments(arguments)
            var newVal = String.prototype[propertyName].apply(this.toString(), args)
            var argumentOrigins = Array.prototype.slice.call(arguments).map(function(arg){
                return {
                        origin: {
                            action: "arg" + "_" + arg.toString()
                        }
                    }
            })
            if (typeof newVal === "string") {
                return makeTraceObject(
                    {
                        value: newVal,
                        origin: makeOrigin({
                            value: newVal,
                            inputValues: [oldValue].concat(argumentOrigins),
                            action: propertyName + " call",
                        })
                    }
                )
            } else if (isArray(newVal)) {
                return newVal.map(function(val){
                    if (typeof val === "string"){
                        return makeTraceObject(
                            {
                                value: val,
                                origin: makeOrigin({
                                    value: val,
                                    inputValues: [oldValue].concat(argumentOrigins),
                                    action: propertyName + " call",
                                })
                            }
                        )
                    } else {
                        return val
                    }
                })
            } else {
                return newVal
            }
        }
    }
})
StringTraceString.prototype.valueOf = function(){
    return this.value;
}
StringTraceString.prototype.toString = function(){
    return this.value
}
StringTraceString.prototype.toJSON = function(){
    return this.value
}

function unstringTracifyArguments(argumentsFromOtherFn){
    var args = []
    for (var i=0;i<argumentsFromOtherFn.length; i++) {
        args.push(stringTraceUseValue(argumentsFromOtherFn[i]))
    }
    return args
}

function makeTraceObject(options){
    var stringTraceObject = new StringTraceString({
        value: options.value,
        origin: options.origin
    })
    return new Proxy(stringTraceObject, {
        ownKeys: function(){
            return []
        }
    });
}

function Origin(opts){
    var inputValues = opts.inputValues.map(function(inputValue){
        if (inputValue instanceof Origin){
            return inputValue
        }
        if (inputValue instanceof Element){
            return inputValue
        }
        if (typeof inputValue === "number") {
            return new Origin({
                action: "Untracked number",
                inputValues: [],
                value: inputValue
            })
        }
        return inputValue.origin
    })

    this.action = opts.action;
    this.inputValues = inputValues;
    this.value = opts.value.toString();
    this.actionDetails = opts.actionDetails;
    this.stack = new Error().stack.split("\n");
}

function makeOrigin(opts){
    return new Origin(opts)

}

function stringTraceUseValue(a){
    if (a && a.isStringTraceString) {
        return a.toString()
    }
    return a;
}

function stringTrace(value){
    return makeTraceObject({
        value: value,
        origin: makeOrigin({
            action: "string literal",
            value: value,
            inputValues: []
        }),
    })
};

function stringTraceTypeOf(a){
    if (a && a.isStringTraceString) {
        return "string"
    }
    return typeof a

}

function stringTraceAdd(a, b){
    var stack = new Error().stack.split("\n")
    if (a == null){
        a = ""
    }
    if (b==null){
        b = ""
    }
    if (!a.isStringTraceString && typeof a === "string"){
        a = stringTrace(a);
    }
    if (!b.isStringTraceString && typeof b === "string"){
        b = stringTrace(b);
    }
    if (!a.isStringTraceString) {
        return a + b;// not a string operation i think, could still be inferred to a stirng tho
    }

    var newValue = a.toString() + b.toString();
    return makeTraceObject({
        value: newValue,
        origin: makeOrigin({
            action: "concat",
            value: newValue,
            inputValues: [a, b]
        })
    })
}

function stringTraceNotTripleEqual(a,b){
    if (a && a.isStringTraceString) {
        a = a.toString()
    }
    if(b && b.isStringTraceString) {
        b = b.toString();
    }
    return a !== b;
}

function stringTraceTripleEqual(a,b){
    return !stringTraceNotTripleEqual(a,b)
}

function stringTraceSetInnerHTML(el, innerHTML){
    // debugger;console.log(innerHTML);console.log(innerHTML.origin)
    el.__elOrigin = [
        {
            action: "assign innerHTML",
            stack: Error().stack.split("\n"),
            inputValues: [innerHTML],
            value: innerHTML.toString()
        }
    ]

    el.innerHTML = innerHTML
}

var originalCreateElement = document.createElement
document.createElement = function(tagName){
    var el = originalCreateElement.call(this, tagName)
    el.__elOriginCreation = makeOrigin({
        action: "createElement",
        inputValues: [tagName],
        value: el.outerHTML
    })
    return el;
}

var appendChildPropertyDescriptor = Object.getOwnPropertyDescriptor(Node.prototype, "appendChild");
Object.defineProperty(Node.prototype, "appendChild", {
    get: function(){
        return function(appendedEl){
            if (!this.__elOrigin) {
                this.__elOrigin = []
            }
            this.__elOrigin.push(makeOrigin({
                action: "appendChild",
                stack: new Error().stack.split("\n"),
                inputValues: [appendedEl],
                value: appendedEl.innerHTML
            }))

            return appendChildPropertyDescriptor.value.apply(this, arguments)
        }
    }
})


var nativeJSONParse = JSON.parse
JSON.parse = function(str){
    var parsedVal = nativeJSONParse.apply(this, arguments)
    for (var key in parsedVal) {
        if (typeof parsedVal[key] !== "string") continue
        parsedVal[key] =  makeTraceObject(
            {
                value: parsedVal[key],
                origin: makeOrigin({
                    value: parsedVal[key],
                    inputValues: [str],
                    action: "JSON.parse",
                    actionDetails: key
                })
            }
        )
    }

    return parsedVal
}

var nativeLocalStorageGetItem = localStorage.getItem
localStorage.getItem = function(key){
    var val = nativeLocalStorageGetItem.apply(this, arguments)
    if (typeof val === "string"){
        val = makeTraceObject({
            value: val,
            origin: makeOrigin({
                action: "localStorage.getItem",
                actionDetails: key,
                value: val,
                inputValues: [key]
            }),
        })
    }
    // debugger;
    return val;
}

var nativeExec = RegExp.prototype.exec;
RegExp.prototype.exec = function(){
    var args = unstringTracifyArguments(arguments)
    return nativeExec.apply(this, args)
}

var nativeFunction = Function
window.Function = function(code){
    var args = Array.prototype.slice.apply(arguments)
    var code = args.pop()
    var argsWithoutCode = args.slice()

    var id = Math.random().toString().replace(".", "");
    filename = "Function" + id + ".js"
    var res = stringTraceCompile(stringTraceUseValue(code), {filename: filename})
    args.push(res.code)
    var script = document.createElement("script")

    var fnName = "fn" + id
    // do this rather than calling the native Function, b/c this way we can have a //#sourceURL (though maybe Function would allow that too?)
    script.innerHTML = "function " + fnName + "(" + argsWithoutCode.join(",") + "){" + res.code + "}" + res.getMappingComment()
    script.setAttribute("fn", "Function" + id)
    script.className = "string-trace-fn";

    script.originalCodeForDebugging = code

    document.body.appendChild(script)



    return function(){
        // debugger;
        return window[fnName].apply(this, arguments)
    }
    // return nativeFunction.apply(this, args)
}

window.stringTraceTripleEqual = stringTraceTripleEqual
window.stringTraceNotTripleEqual = stringTraceNotTripleEqual
window.stringTrace = stringTrace
window.stringTraceUseValue = stringTraceUseValue
window.stringTraceTypeOf = stringTraceTypeOf
window.stringTraceSetInnerHTML = stringTraceSetInnerHTML
window.stringTraceAdd = stringTraceAdd
window.nativeJSONParse = nativeJSONParse

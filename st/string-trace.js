require("./compile")
require("./getVisData")
require("./stackframe")
require("./source-map")
var $ = require("jquery")
var ValueMap = require("../value-map")
var _ = require("underscore")

console.log("in stringtrace js")

function processElementsAvailableOnInitialLoad(){
    return;



    var els = document.querySelectorAll("*")

    els = Array.prototype.slice.apply(els)
    els.forEach(function(el){
        el.__elOrigin = [];

        addElOrigin(el, {
            value: el.outerHTML.replace(el.innerHTML, ""),
            action: "initial html tag",
            inputValues: []
        })

        addElOrigin(el, {
            value: el.innerHTML,
            action: "initial html content",
            inputValues: []
        })

    })
}
console.log("adding")
window.addEventListener("load", function(){
    console.log("processElementsAvailableOnInitialLoad")
    processElementsAvailableOnInitialLoad();
})

export function disableTracing(){
    window.JSON.parse = window.nativeJSONParse
    document.createElement = window.originalCreateElement
    Object.defineProperty(Node.prototype, "appendChild", window.originalAppendChildPropertyDescriptor);
    Element.prototype.setAttribute = window.nativeSetAttribute
    localStorage.getItem = window.nativeLocalStorageGetItem;
}

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
                return makeOrigin({
                    action: "arg_" + arg.toString(),
                    value: arg.toString(),
                    inputValues: []
                })
            })
            var inputValues = [oldValue.origin].concat(argumentOrigins)

            var valueItems = null;
            if (propertyName === "replace") {
                var valueMap = new ValueMap();
                var oldString = oldValue.toString()
                var inputMappedSoFar = ""
                oldString.replace(args[0], function(matchStr, index){
                    if (typeof args[1] !== "string") throw "not handled"
                    var inputBeforeToKeep = oldString.substring(inputMappedSoFar.length, index)
                    valueMap.appendString(inputBeforeToKeep , oldValue.origin, inputMappedSoFar.length)
                    inputMappedSoFar += inputBeforeToKeep

                    var replaceWith = inputValues[2].value
                    valueMap.appendString(replaceWith, inputValues[2], 0)
                    inputMappedSoFar += matchStr

                    return args[1]
                })
                valueMap.appendString(oldString.substring(inputMappedSoFar.length), oldValue.origin, inputMappedSoFar.length)

                valueItems = valueMap.serialize(inputValues)
            }

            if (typeof newVal === "string") {
                return makeTraceObject(
                    {
                        value: newVal,
                        origin: makeOrigin({
                            value: newVal,
                            valueItems: valueItems,
                            inputValues: inputValues,
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
                                    inputValues: inputValues,
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

    this.inputValuesCharacterIndex = opts.inputValuesCharacterIndex

    this.value = opts.value && opts.value.toString();
    this.valueOfEl = opts.valueOfEl
    this.valueItems = opts.valueItems
    this.getValue = function(){
        if (this.valueOfEl) {
            return this.valueOfEl.outerHTML
        }
        return this.value
    }
    this.actionDetails = opts.actionDetails;
    this.stack = new Error().stack.split("\n").filter(function(frame){
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

function addElOrigin(el, what, originInfo){
    if (!originInfo) debugger
    if (!el.__elOrigin) {
        el.__elOrigin = {}
    }



    if (what === "replaceContents") {
        el.__elOrigin.contents = originInfo.children
    } else if(what==="appendChild") {
        if (!el.__elOrigin.contents) {
            el.__elOrigin.contents = []
        }
        el.__elOrigin.contents.push(originInfo.child)
    } else {
        var origin = makeOrigin(originInfo)
        el.__elOrigin[what] = origin;
    }



    // if (originInfo.action === "removeAttribute") {
    //     el.__elOrigin = el.__elOrigin.filter(function(existingOrigin){
    //         if (existingOrigin.action !== "setAttribute") {
    //             return true;
    //         }
    //
    //         if (existingOrigin.inputValues[0].value !== origin.inputValues[0].value){
    //             return true;
    //         }
    //
    //         return false;
    //     })
    // } else {
    //      el.__elOrigin.push(origin)
    // }
}

function stringTraceSetInnerHTML(el, innerHTML){


    el.innerHTML = innerHTML

    var forDebuggingProcessedHtml = ""
    var charOffset = 0;
    processNewInnerHtml(el)


    function processNewInnerHtml(el){
        var children = Array.prototype.slice.apply(el.childNodes, [])
        addElOrigin(el, "replaceContents", {
            action: "ancestor innerHTML",
            children: children
        })

        $(el).contents().each(function(i, child){
            var isTextNode = child.innerHTML === undefined;
            if (isTextNode) {
                addElOrigin(child, "textValue", {
                    "action": "ancestor innerHTML",
                    inputValues: [innerHTML],
                    value: innerHTML.toString(),
                    inputValuesCharacterIndex: [charOffset]
                })
                charOffset += child.textContent.length
                forDebuggingProcessedHtml += child.textContent
            } else {
                addElOrigin(child, "tagName", {
                    action: "ancestor innerHTML",
                    inputValues: [innerHTML],
                    inputValuesCharacterIndex: [charOffset],
                    value: child.tagName
                })
                var openingTagStart = "<" + child.tagName
                charOffset += openingTagStart.length
                forDebuggingProcessedHtml += openingTagStart

                for (var i = 0;i<child.attributes.length;i++) {
                    var attr = child.attributes[i]

                    addElOrigin(child, "attribute_" + attr.name, {
                        action: "ancestor innerHTML",
                        inputValues: [innerHTML],
                        value: attr.textContent
                    })

                    var attrStr = " " + attr.name
                    if (attr.textContent !== ""){
                        attrStr += "='" + attr.textContent +  "'"
                    }
                    charOffset += attrStr.length
                    forDebuggingProcessedHtml += attrStr
                }

                var openingTagEnd = ""
                if (!tagTypeHasClosingTag(child.tagName)) {
                    openingTagEnd +=  "/"
                }
                openingTagEnd += ">"
                charOffset += openingTagEnd.length
                forDebuggingProcessedHtml += openingTagEnd

                processNewInnerHtml(child)

                if (tagTypeHasClosingTag(child.tagName)) {
                    var closingTag = "</" + child.tagName + ">"
                    charOffset += closingTag.length
                    forDebuggingProcessedHtml += closingTag
                }
            }
            console.log("processed", forDebuggingProcessedHtml, innerHTML.toString().toLowerCase().replace(/\"/g, "'") === forDebuggingProcessedHtml.toLowerCase())
        })
    }

    // if (innerHTML.toString().toLowerCase().replace(/\"/g, "'") !== forDebuggingProcessedHtml.toLowerCase()){
    //     debugger;
    // }


}

function tagTypeHasClosingTag(tagName){
    return originalCreateElement.apply(document, [tagName]).outerHTML.indexOf("></") !== -1
}
window.tagTypeHasClosingTag = tagTypeHasClosingTag

if (!window.tracingEnabled){
    enableTracing()
}

function enableTracing(){
    window.tracingEnabled = true

    var originalCreateElement = document.createElement
    window.originalCreateElement = originalCreateElement
    document.createElement = function(tagName){

        var el = originalCreateElement.call(this, tagName)
        addElOrigin(el, "tagName", {
            action: "createElement",
            inputValues: [tagName],
            value: el.tagName
        })
        return el;
    }

    var appendChildPropertyDescriptor = Object.getOwnPropertyDescriptor(Node.prototype, "appendChild");
    window.originalAppendChildPropertyDescriptor = appendChildPropertyDescriptor
    Object.defineProperty(Node.prototype, "appendChild", {
        get: function(){
            return function(appendedEl){
                addElOrigin(this, "appendChild",{
                    action: "appendChild",
                    stack: new Error().stack.split("\n"),
                    inputValues: [appendedEl],
                    valueOfEl: appendedEl,
                    child: appendedEl
                })

                return appendChildPropertyDescriptor.value.apply(this, arguments)
            }
        }
    })

    var nativeSetAttribute = Element.prototype.setAttribute;
    window.nativeSetAttribute = nativeSetAttribute
    Element.prototype.setAttribute = function(attrName, value){
        addElOrigin(this, "attribute_" + attrName.toString(), {
            action: "setAttribute",
            inputValues: [attrName, value],
            value: "not gotten around to making this work yet"
        })
        return nativeSetAttribute.apply(this, arguments)
    }

    var nativeRemoveAttribute = Element.prototype.removeAttribute;
    Element.prototype.removeAttribute = function(attrName){
        addElOrigin(this, "attribute_" +attrName.toString(), {
            action: "removeAttribute",
            inputValues: [attrName],
            value: "whateverr"
        })
        return nativeRemoveAttribute.apply(this, arguments)
    }

    var nativeClassNameDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, "className");
    Object.defineProperty(Element.prototype, "className", {
        set: function(newValue){
            addElOrigin(this, "attribute_class", {
                action: "set className",
                value: newValue.toString(),
                inputValues: [newValue]
            })
            return nativeClassNameDescriptor.set.apply(this, arguments)
        },
        get: function(){
            return nativeClassNameDescriptor.get.apply(this, arguments)
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
    window.nativeLocalStorageGetItem = nativeLocalStorageGetItem
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
        var filename = "Function" + id + ".js"
        var res = stringTraceCompile(stringTraceUseValue(code), {filename: filename})
        args.push(res.code)
        var script = document.createElement("script")

        var fnName = "fn" + id
        var smFilename = filename + ".map"
        script.innerHTML = "function " + fnName + "(" + argsWithoutCode.join(",") + "){" + res.code + "}" + "\n//# sourceURL=" + filename + "\n//# sourceMappingURL=" + smFilename
        script.setAttribute("sm", encodeURIComponent(JSON.stringify(res.map)))
        script.setAttribute("sm-filename", smFilename)
        script.setAttribute("fn", "Function" + id)
        script.setAttribute("original-source", encodeURIComponent(code))
        script.className = "string-trace-fn";

        script.originalCodeForDebugging = code

        document.body.appendChild(script)



        return function(){
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

}

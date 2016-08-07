import addElOrigin from "./addElOrigin"
import unstringTracifyArguments from "./unstringTracifyArguments"
import {makeTraceObject} from "./FromJSString"
import Origin from "../origin"
import _ from "underscore"
import stringTraceUseValue from "./stringTraceUseValue"
import {makeSureInitialHTMLHasBeenProcessed} from "./processElementsAvailableOnInitialLoad"
import processJavaScriptCode from "../compilation/processJavaScriptCode"
import mapInnerHTMLAssignment from "./mapInnerHTMLAssignment"
import untrackedString from "./untrackedString"
import trackStringIfNotTracked from "./trackStringIfNotTracked"


// this is just doing both window.sth and var sth because I've been inconsistent in the past, not because it's good...
// should be easy ish to change, however some FromJS functions run while
// tracing is enabled, so they use window.nativeSth to access it
window.fromJSDynamicFiles = {}
window.fromJSDynamicFileOrigins = {}
var tracingEnabled = false;

var originalCreateElement = document.createElement
window.originalCreateElement = originalCreateElement

var appendChildPropertyDescriptor = Object.getOwnPropertyDescriptor(Node.prototype, "appendChild");
window.originalAppendChildPropertyDescriptor = appendChildPropertyDescriptor

var nativeSetAttribute = Element.prototype.setAttribute;
window.nativeSetAttribute = nativeSetAttribute

var nativeClassNameDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, "className");
window.nativeClassNameDescriptor = nativeClassNameDescriptor

var nativeInnerHTMLDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML");
window.nativeInnerHTMLDescriptor = nativeInnerHTMLDescriptor;

var nativeHTMLScriptElementTextDescriptor = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, "text")

var nativeExec = RegExp.prototype.exec;
window.nativeExec = nativeExec;

var nativeFunction = Function
window.nativeFunction = nativeFunction

var nativeJSONParse = JSON.parse
window.nativeJSONParse = nativeJSONParse

var nativeLocalStorage = window.localStorage;
window.originalLocalStorage = nativeLocalStorage

var originalXMLHttpRequest = window.XMLHttpRequest

var nativeEval = window.eval

var nativeArrayJoin = Array.prototype.join
var nativeArrayIndexOf = Array.prototype.indexOf

var nativeNodeTextContentDescriptor = Object.getOwnPropertyDescriptor(Node.prototype, "textContent")

function processJavaScriptCodeWithTracingDisabled(){
    var tracingEnabledAtStart = tracingEnabled;
    if (tracingEnabledAtStart) {
        disableTracing();
    }
    var ret = processJavaScriptCode.apply(this, arguments)
    if (tracingEnabledAtStart) {
        enableTracing();
    }
    return ret
}

export function enableTracing(){
    if (tracingEnabled){
        return
    }
    tracingEnabled = true



    document.createElement = function(tagName){

        var el = originalCreateElement.call(this, tagName)
        addElOrigin(el, "openingTagStart", {
            action: "createElement",
            inputValues: [tagName],
            value: el.tagName
        })
        addElOrigin(el, "openingTagEnd", {
            action: "createElement",
            inputValues: [tagName],
            value: el.tagName
        })
        addElOrigin(el, "closingTag", {
            action: "createElement",
            inputValues: [tagName],
            value: el.tagName
        })
        return el;
    }


    Object.defineProperty(Node.prototype, "appendChild", {
        get: function(){
            return function(appendedEl){
                if (appendedEl instanceof DocumentFragment){
                    appendedEl.childNodes.forEach((child) => {
                        this.appendChild(child)
                    })
                } else {
                    addElOrigin(this, "appendChild",{
                        action: "appendChild",
                        stack: new Error().stack.split("\n"),
                        inputValues: [appendedEl],
                        valueOfEl: appendedEl,
                        child: appendedEl
                    })

                    appendChildPropertyDescriptor.value.apply(this, arguments)
                }
                return appendedEl;
            }
        }
    })

    window.XMLHttpRequest = function(){
        var self = this;
        this.open = function(){
            self.xhr = new originalXMLHttpRequest()
            self.xhr.onreadystatechange = function(e){
                if (self.xhr.readyState === originalXMLHttpRequest.DONE) {
                    self.responseText = makeTraceObject({
                        value: self.xhr.responseText,
                        origin: new Origin({
                            value: self.xhr.responseText,
                            inputValues: [],
                            action: "XHR Response"
                        })
                    })
                    self.status = self.xhr.status
                    self.readyState = self.xhr.readyState
                    if (self.onreadystatechange) {
                        // debugger
                        self.onreadystatechange(e)
                    }

                    if (self.onload){
                        // debugger
                        self.onload()
                    }
                } else {
                    console.log("ignoreing ajax result")
                }
            }
            this.xhr.open.apply(self.xhr, arguments)
        }
        this.send = function(){
            this.xhr.send.apply(self.xhr, arguments)
        }
    }

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


    Object.defineProperty(Element.prototype, "className", {
        set: function(newValue){
            addElOrigin(this, "attribute_class", {
                action: "set className",
                value: " class='" + newValue.toString() + "'",
                inputValues: [newValue]
            })
            return nativeClassNameDescriptor.set.apply(this, arguments)
        },
        get: function(){
            return nativeClassNameDescriptor.get.apply(this, arguments)
        }
    })

    JSON.parse = function(str, rootStr){
        var parsedVal = nativeJSONParse.apply(this, arguments)
        if (rootStr === undefined) {
            rootStr = str
        }

        for (var key in parsedVal) {
            var value = parsedVal[key]
            if (_.isArray(value) || _.isObject(value)){
                parsedVal[key] = JSON.parse(makeTraceObject({
                    value: JSON.stringify(value),
                    origin: str.origin
                }), rootStr)
            } else if (typeof value === "string" ||
                typeof value === "boolean" ||
                typeof value === "number") {

                parsedVal[key] =  makeTraceObject(
                    {
                        value: parsedVal[key],
                        origin: new Origin({
                            value: parsedVal[key],
                            inputValues: [str],
                            inputValuesCharacterIndex: [rootStr.toString().indexOf(parsedVal[key])], // not very accurate, but better than nothing/always using char 0
                            action: "JSON.parse",
                            actionDetails: key
                        })
                    }
                )
            } else {
                throw "no"
            }
        }

        return parsedVal
    }

    Array.prototype.join = function(separator){
        var separatorArgumentIsUndefined = separator === undefined;
        if (separatorArgumentIsUndefined){
            separator = "";
        }
        var stringifiedItems = this.map(function(item){
            var stringifiedItem = item;

            while (typeof stringifiedItem !== "string") {
                stringifiedItem = stringifiedItem.toString()
            }
            return stringifiedItem
        })
        var trackedInputItems = this.map(trackStringIfNotTracked)
        var trackedSeparator = trackStringIfNotTracked(separator)
        var inputValues = [trackedSeparator].concat(trackedInputItems)
        // .join already does stringification, but we may need to call .toString()
        // twice if there is an object with a toString function which returns
        // a FromJSString (an object) which needs to be converted to a native string
        var joinedValue = nativeArrayJoin.apply(stringifiedItems, [separator])
        if (separatorArgumentIsUndefined){
            // just bail out, I think there are issues with unprocessed code trying to
            // use array join with nested arrays and stuff, which just
            // breaks everything and gives a "Cannot convert object to primitive value"
            // error
            return joinedValue;
        }
        var ret = makeTraceObject({
            value: joinedValue,
            origin: new Origin({
                action: "Array Join Call",
                inputValues: inputValues,
                value: joinedValue
            })
        })
        return ret
    }

    Array.prototype.indexOf = function(value){
        var arrayItems = this.map(stringTraceUseValue)
        return nativeArrayIndexOf.apply(arrayItems, [stringTraceUseValue(value)])
    }

    function processScriptTagCodeAssignment(code){
        var id = _.uniqueId();
        var filename = "ScriptTag" + id + ".js"
        var res = processJavaScriptCodeWithTracingDisabled(stringTraceUseValue(code), {filename: filename})

        var fnName = "DynamicFunction" + id
        var smFilename = filename + ".map"
        var evalCode = res.code + "\n" +
            "\n//# sourceURL=" + filename +
            "\n//# sourceMappingURL=" + smFilename

        registerDynamicFile(filename, code, evalCode, res.map)

        return evalCode
    }

    Object.defineProperty(Node.prototype, "textContent", {
        get: function(){
            return nativeNodeTextContentDescriptor.get.apply(this, arguments)
        },
        set: function(newTextContent){
            var el = this;

            if (el.tagName === "SCRIPT") {
                newTextContent = processScriptTagCodeAssignment(newTextContent)
            }

            var ret = nativeNodeTextContentDescriptor.set.apply(this, [newTextContent])

            addElOrigin(el, "replaceContents", el.childNodes)
            if (newTextContent.toString() !== ""){
                var childNode = el.childNodes[0];
                el.__elOrigin.contents = [childNode]

                addElOrigin(childNode, "textValue", {
                    action: "Assign textContent",
                    inputValues: [newTextContent],
                    value: newTextContent.toString()
                })
            }

            return ret;
        }
    })

    Object.defineProperty(HTMLScriptElement.prototype, "text", {
        get: function(){
            return nativeHTMLScriptElementTextDescriptor.get.apply(this, arguments)
        },
        set: function(text){
            text = processScriptTagCodeAssignment(text)
            return nativeHTMLScriptElementTextDescriptor.set.apply(this, [text])
        }
    })

    Object.defineProperty(Element.prototype, "innerHTML", {
        set: function(innerHTML){
            if (document.contains(this)){
                makeSureInitialHTMLHasBeenProcessed();
            }


            var ret = nativeInnerHTMLDescriptor.set.apply(this, arguments)
            mapInnerHTMLAssignment(this, innerHTML, "Assign InnerHTML")
            return ret
        },
        get: function(){
            if (document.contains(this)){
                makeSureInitialHTMLHasBeenProcessed()
            }

            var innerHTML = nativeInnerHTMLDescriptor.get.apply(this, arguments)
            return makeTraceObject({
                value: innerHTML,
                origin: new Origin({
                    value: innerHTML,
                    action: "Read Element innerHTML",
                    inputValues: []
                })
            })
        }
    })


    Object.defineProperty(window, "localStorage", {
        get: function(){
            return new Proxy(nativeLocalStorage, {
                get: function(target, name){
                    if (name === "getItem") {
                        return function getItem(key){
                            var val = nativeLocalStorage.getItem.apply(target, arguments)
                            if (typeof val === "string"){
                                val = makeTraceObject({
                                    value: val,
                                    origin: new Origin({
                                        action: "localStorage.getItem",
                                        actionDetails: key,
                                        value: val,
                                        inputValues: [key]
                                    }),
                                })
                            }
                            return val;
                        }
                    }

                    var res = nativeLocalStorage[name]
                    var propertyValueIsLocalStorageData = nativeLocalStorage.hasOwnProperty(name)
                    if (propertyValueIsLocalStorageData){
                        res = makeTraceObject({
                            value: res,
                            origin: new Origin({
                                action: "localStorage.getItem",
                                actionDetails: name,
                                value: res,
                                inputValues: [name]
                            }),
                        })
                    }

                    if (typeof res === "function"){
                        return res.bind(target)
                    }
                    return res;
                }
            })
        }
    })

    window.eval = function(code){
        var id = _.uniqueId();
        var filename = "DynamicScript" + id + ".js"
        var res = processJavaScriptCodeWithTracingDisabled(stringTraceUseValue(code), {filename: filename})

        var smFilename = filename + ".map"
        var evalCode = res.code + "\n//# sourceURL=" + filename +
            "\n//# sourceMappingURL=" + smFilename

        registerDynamicFile(filename, code, evalCode, res.map)

        return nativeEval(evalCode)
    }

    RegExp.prototype.exec = function(){
        var args = unstringTracifyArguments(arguments)
        return nativeExec.apply(this, args)
    }

    window.Function = function(code){
        var args = Array.prototype.slice.apply(arguments)
        var code = args.pop()
        var argsWithoutCode = args.slice()

        var id = _.uniqueId();
        var filename = "DynamicFunction" + id + ".js"
        var res = processJavaScriptCodeWithTracingDisabled(stringTraceUseValue(code), {filename: filename})
        args.push(res.code)


        var fnName = "DynamicFunction" + id
        var smFilename = filename + ".map"
        var evalCode = "function " + fnName + "(" + argsWithoutCode.join(",") + "){" + res.code + "}" +
            "\n//# sourceURL=" + filename +
            "\n//# sourceMappingURL=" + smFilename

        // create script tag instead of eval to prevent strict mode from propagating
        // (I'm guessing if you call eval from code that's in strict mode  strict mode will
        // propagate to the eval'd code.)
        var script = document.createElement("script")
        script.innerHTML = evalCode
        document.body.appendChild(script)

        script.remove();

        registerDynamicFile(filename, code, evalCode, res.map)

        return function(){
            return window[fnName].apply(this, arguments)
        }
    }
    window.Function.prototype = nativeFunction.prototype

    function registerDynamicFile(filename, code, evalCode, sourceMap){
        var smFilename = filename + ".map"
        code = trackStringIfNotTracked(code)

        fromJSDynamicFiles[smFilename] = sourceMap
        fromJSDynamicFiles[filename] = evalCode
        fromJSDynamicFiles[filename + "?dontprocess=yes"] = code.value
        fromJSDynamicFileOrigins[filename + "?dontprocess=yes"] = new Origin({
            action: "Dynamic Script",
            value: code.value,
            inputValues: [code.origin]
        })
    }




    // try to add this once, but it turned out the .dataset[sth] assignment
    // was in a chrome extension that uses a different HTMLElement object
    window.nativeDataSetDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "dataset")
    // Object.defineProperty(HTMLElement.prototype, "dataset", {
    //     set: function(){
    //         return nativeDataSetDescriptor.set.apply(this, arguments)
    //     },
    //     get: function(){
    //         var nativeRes = nativeDataSetDescriptor.get.apply(this, arguments)
    //
    //         var proxy = new Proxy(nativeRes, {
    //             set: function(target, name, value){
    //                 nativeRes[name] = value
    //             }
    //         })
    //         return proxy;
    //     }
    // })

}


export function disableTracing(){
    if (!tracingEnabled) {
        return;
    }
    window.JSON.parse = window.nativeJSONParse
    document.createElement = window.originalCreateElement
    Object.defineProperty(Node.prototype, "appendChild", window.originalAppendChildPropertyDescriptor);
    Element.prototype.setAttribute = window.nativeSetAttribute
    Object.defineProperty(Element.prototype, "innerHTML", nativeInnerHTMLDescriptor)
    Object.defineProperty(window, "localStorage", {
        get: function(){
            return window.originalLocalStorage
        }
    })
    RegExp.prototype.exec = window.nativeExec
    window.Function = nativeFunction
    Object.defineProperty(Element.prototype, "className", window.nativeClassNameDescriptor)
    Object.defineProperty(HTMLElement.prototype, "dataset", window.nativeDataSetDescriptor)
    Object.defineProperty(Node.prototype, "textContent", nativeNodeTextContentDescriptor)
    Object.defineProperty(HTMLScriptElement.prototype, "text", nativeHTMLScriptElementTextDescriptor)
    window.XMLHttpRequest = originalXMLHttpRequest
    Array.prototype.join = nativeArrayJoin
    Array.prototype.indexOf = nativeArrayIndexOf
    window.eval = nativeEval

    tracingEnabled = false;
}

window._disableTracing = disableTracing

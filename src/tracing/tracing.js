import addElOrigin from "./addElOrigin"
import unstringTracifyArguments from "./unstringTracifyArguments"
import {makeTraceObject} from "./FromJSString"
import Origin from "../origin"
import _ from "underscore"
import stringTraceUseValue from "./stringTraceUseValue"
import processJavaScriptCode, {removeSourceMapIfAny} from "../compilation/processJavaScriptCode"
import mapInnerHTMLAssignment from "./mapInnerHTMLAssignment"
import untrackedString from "./untrackedString"
import trackStringIfNotTracked from "./trackStringIfNotTracked"
import endsWith from "ends-with"
import toString from "../untracedToString"
import {getScriptElements} from "../getJSScriptTags"

var tracingEnabled = false;

// This code does both window.sth and var sth because I've been inconsistent in the past, not because it's good...
// should be easy ish to change, however some FromJS functions run while
// tracing is enabled, so they use window.nativeSth to access it
var originalCreateElement = document.createElement
window.originalCreateElement = originalCreateElement

var nativeCreateElementNS = document.createElementNS
var nativeCreateComment = document.createComment;
var nativeDocumentWrite = document.write;

var appendChildPropertyDescriptor = Object.getOwnPropertyDescriptor(Node.prototype, "appendChild");
window.originalAppendChildPropertyDescriptor = appendChildPropertyDescriptor

var nativeSetAttribute = Element.prototype.setAttribute;
window.nativeSetAttribute = nativeSetAttribute

var nativeClassNameDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, "className");
window.nativeClassNameDescriptor = nativeClassNameDescriptor

var nativeInnerHTMLDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML");
window.nativeInnerHTMLDescriptor = nativeInnerHTMLDescriptor;

var nativeHTMLScriptElementTextDescriptor = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, "text")
window.nativeHTMLScriptElementTextDescriptor = nativeHTMLScriptElementTextDescriptor

var nativeExec = RegExp.prototype.exec;
window.nativeExec = nativeExec;

var nativeFunction = Function
window.nativeFunction = nativeFunction

var nativeJSONParse = JSON.parse
window.nativeJSONParse = nativeJSONParse

var nativeJSONStringify = JSON.stringify

var nativeObjectHasOwnProperty = Object.prototype.hasOwnProperty

var nativeStringObject = String;
window.nativeStringObject = nativeStringObject

var nativeLocalStorage = window.localStorage;
window.originalLocalStorage = nativeLocalStorage

var nativeObjectToString = Object.prototype.toString
window.nativeObjectToString = nativeObjectToString
var nativeArrayToString = Array.prototype.toString

var nativeAddEventListener = Node.prototype.addEventListener
var nativeRemoveEventListener = Node.prototype.removeEventListener

var nativeCloneNode = Node.prototype.cloneNode;

var originalXMLHttpRequest = window.XMLHttpRequest

var nativeCreateTextNode = document.createTextNode

var nativeEval = window.eval
var nativeOuterHTMLDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, "outerHTML")

var nativeObjectGetOwnPropertyNames = Object.getOwnPropertyNames
var nativeObjectKeys = Object.keys

var nativeCSSStyleDeclarationSetProperty = CSSStyleDeclaration.prototype.setProperty

var nativeArrayJoin = Array.prototype.join
var nativeArrayIndexOf = Array.prototype.indexOf

var nativeHTMLInputElementValueDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")

var nativeNodeTextContentDescriptor = Object.getOwnPropertyDescriptor(Node.prototype, "textContent")

var nativeHTMLElementInsertAdjacentHTML = HTMLElement.prototype.insertAdjacentHTML

var nativeHTMLElementStyleDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "style")
var nativeSVGElementStyleDescriptor = Object.getOwnPropertyDescriptor(SVGElement.prototype, "style")

var nativeNumberToString = Number.prototype.toString
window.nativeNumberToString = nativeNumberToString

var nativeNumberToFixed = Number.prototype.toFixed

var nativeStringFunctions = Object.getOwnPropertyNames(String.prototype)
    .map(function(propertyName){
        var value = String.prototype[propertyName];
        return {
            name: propertyName,
            fn: value
        }
    })
    .filter(function(prop){
        return typeof prop.fn === "function" && prop.name !== "toString" && prop.name !== "valueOf"
    })

export function runFunctionWithTracingDisabled(fn){
    var tracingEnabledAtStart = tracingEnabled;
    if (tracingEnabledAtStart) {
        disableTracing();
    }
    var ret = fn();
    if (tracingEnabledAtStart) {
        enableTracing();
    }
    return ret
}

function processJavaScriptCodeWithTracingDisabled(){
    var args = arguments
    var self = this
    return runFunctionWithTracingDisabled(function(){
        return processJavaScriptCode.apply(self, args)
    })
}

var eventListenersEnabled = true;
export function enableEventListeners(){
    eventListenersEnabled = true
}
export function disableEventListeners(){
    eventListenersEnabled = false
}


function isTracedString(val){
    return !!val && val.isStringTraceString;
}

export function enableTracing(){
    if (tracingEnabled){
        return
    }
    tracingEnabled = true

    function addOriginInfoToCreatedElement(el, tagName, action){
        addElOrigin(el, "openingTagStart", {
            action,
            inputValues: [tagName],
            value: el.tagName
        })
        addElOrigin(el, "openingTagEnd", {
            action,
            inputValues: [tagName],
            value: el.tagName
        })
        addElOrigin(el, "closingTag", {
            action,
            inputValues: [tagName],
            value: el.tagName
        })
    }

    document.createElement = function(tagName){
        var el = originalCreateElement.call(this, tagName)
        addOriginInfoToCreatedElement(el, tagName, "createElement")
        return el;
    }

    document.createElementNS = function(namespace, tagName){
        var el = nativeCreateElementNS.call(this, namespace, tagName)
        addOriginInfoToCreatedElement(el, tagName, "createElementNS")
        return el
    }

    document.createComment = function(commentContent){
        var comment = nativeCreateComment.call(this, commentContent);

        addElOrigin(comment, "commentStart", {
            action: "createComment",
            inputValues: [],
            value: "<!--"
        })

        addElOrigin(comment, "commentEnd", {
            action: "createComment",
            inputValues: [],
            value: "-->"
        })

        addElOrigin(comment, "textValue", {
            action: "createComment",
            inputValues: [commentContent],
            value: toString(commentContent)
        })

        return comment;
    }

    document.createTextNode = function(text){
        var node = nativeCreateTextNode.apply(this, arguments)
        addElOrigin(node, "textValue", {
            action: "createTextNode",
            value: text.toString(),
            inputValues: [text]
        })
        return node;
    }

    nativeStringFunctions.forEach(function(prop){
        // Don't do for now... breaks too much stuff
        // String.prototype[prop.name] = function(){
        //     var str = untrackedString(this)
        //     var ret = str[prop.name].apply(str, arguments)
        //     return ret;
        // }
    })


    Object.defineProperty(Node.prototype, "appendChild", {
        get: function(){
            return function(appendedEl){
                if (appendedEl instanceof DocumentFragment){
                    var childNodes = []
                    // appending a child from a doc fragment to the DOM
                    // means it's removed from the doc fragment, so
                    // make a list that won't change when calling appendChild
                    appendedEl.childNodes.forEach((child) => {
                        childNodes.push(child)
                    })
                    childNodes.forEach((child) => {
                        this.appendChild(child)
                    })
                } else {
                    addElOrigin(this, "appendChild",{
                        // looks like at least for now none of this is used
                        // action: "appendChild",
                        // inputValues: [appendedEl],
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
        self.xhr = new originalXMLHttpRequest()
        this.open = function(){
            self.xhr.onreadystatechange = function(e){
                if (self.xhr.readyState === originalXMLHttpRequest.DONE) {
                    Object.defineProperty(self, "responseText", {
                        get: function(){
                            return makeTraceObject({
                                value: self.xhr.responseText,
                                origin: new Origin({
                                    value: self.xhr.responseText,
                                    inputValues: [],
                                    action: "XHR responseText"
                                })
                            })
                        }
                    })

                    if (self.onreadystatechange) {
                        self.onreadystatechange(e)
                    }

                    if (self.onload){
                        self.onload()
                    }
                } else {
                    console.log("Ignoring Ajax State Change")
                }
            }
            this.xhr.open.apply(self.xhr, arguments)
        }

        var propsToCopy = [
            "UNSENT", "OPENED", "HEADERS_RECEIVED", "LOADING",
            "DONE", "readyState", "timeout", "withCredentials",
            "upload",
            "responseURL", "status", "statusText", "responseType",
            "response", "responseXML", "setRequestHeader",
            "abort",
            "send", "getResponseHeader", "getAllResponseHeaders",
            "overrideMimeType", "addEventListener",
            "removeEventListener", "dispatchEvent"
        ]

        propsToCopy.forEach(function(key){
            Object.defineProperty(self, key, {
                get: function(){
                    var value = self.xhr[key]
                    if (typeof value === "function"){
                        value = value.bind(self.xhr)
                    }
                    return value
                },
                set: function(value){
                    return self.xhr[key] = value
                }
            })
        })
    }

    Element.prototype.setAttribute = function(attrName, value){
        addElOrigin(this, "attribute_" + attrName.toString(), {
            action: "setAttribute",
            inputValues: [attrName, value],
            value: " " + attrName.toString() + "='" + value.toString() + "'"
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

    Object.prototype.hasOwnProperty = function(propName){
        if (this.isStringTraceString) {
            return nativeObjectHasOwnProperty.call(this.value, propName)
        }
        return nativeObjectHasOwnProperty.call(this, propName)
    }

    function filterOutTrackingPropertyNames(propNames){
        return propNames.filter(function(name){
            return !endsWith(name, "_trackedName")
        })
    }

    Object.getOwnPropertyNames = function(obj){
        if (obj.isStringTraceString) {
            var str = obj.value;
            var names = [];
            for (var name in str) {
                names.push(name)
            }
            names.push("length")
            return names
        } else {
            var names = nativeObjectGetOwnPropertyNames(obj);
            return filterOutTrackingPropertyNames(names)
        }
    }

    Object.keys = function(obj){
        if (obj.isStringTraceString) {
            var str = obj.value
            var keys = [];
            for (var key in str) {
                keys.push(key)
            }
            return keys
        } else {
            var keys = nativeObjectKeys(obj)
            return filterOutTrackingPropertyNames(keys)
        }
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
                    value: nativeJSONStringify.call(JSON, value),
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
                            action: "JSON.parse"
                        })
                    }
                )
            }
        }

        return parsedVal
    }

    JSON.stringify = function(str){
        if (typeof str === "string" || str.isStringTraceString) {
            return makeTraceObject({
                value: '"' + toString(str) + '"',
                origin: new Origin({
                    value: str,
                    inputValues: [str],
                    action: "JSON.stringify"
                })
            })
        } else {
            return nativeJSONStringify.apply(this, arguments)
        }
    }

    var eventListenerFunctionMap = new Map()
    function getExistingUsedFunction(originalFunction) {
        return eventListenerFunctionMap.get(originalFunction)
    }
    Node.prototype.addEventListener = function(){
        var originalFunction = arguments[1]

        var usedFunction = getExistingUsedFunction(originalFunction)
        if (usedFunction === undefined){
            usedFunction = function(){
                if (eventListenersEnabled) {
                    originalFunction.apply(this, arguments)
                } else {
                    console.log("Not handling event", arguments)
                }
            }
            eventListenerFunctionMap.set(originalFunction, usedFunction)
        }

        arguments[1] = usedFunction
        nativeAddEventListener.apply(this, arguments)
    }

    Node.prototype.removeEventListener = function(){
        var originalFunction = arguments[1]
        var usedFunction = getExistingUsedFunction(originalFunction)
        arguments[1] = usedFunction;
        nativeRemoveEventListener.apply(this, arguments)
    }

    var defaultArrayJoinSeparator = makeTraceObject({
        value: ",",
        origin: new Origin({
            action: "Default Array Join Separator",
            error: {stack: ""},
            value: ",",
            inputValues: []
        })
    })

    function tracedArrayJoin(separator){
        var separatorArgumentIsUndefined = separator === undefined;
        if (separatorArgumentIsUndefined){
            separator = defaultArrayJoinSeparator
        }
        var stringifiedItems = Array.prototype.map.call(this, function(item){
            var stringifiedItem = item;

            while (typeof stringifiedItem !== "string") {
                stringifiedItem = stringifiedItem.toString()
            }
            return stringifiedItem
        })

        var trackedInputItems = Array.prototype.map.call(this, trackStringIfNotTracked)
        var trackedSeparator = trackStringIfNotTracked(separator)
        var inputValues = [trackedSeparator].concat(trackedInputItems)
        // .join already does stringification, but we may need to call .toString()
        // twice if there is an object with a toString function which returns
        // a FromJSString (an object) which needs to be converted to a native string
        var joinedValue = nativeArrayJoin.apply(stringifiedItems, [separator])

        try {
            var ret = makeTraceObject({
                value: joinedValue,
                origin: new Origin({
                    action: "Array Join Call",
                    inputValues: inputValues,
                    value: joinedValue
                })
            })
        } catch (e){
            // I think there are issues with unprocessed code trying to
            // use array join with nested arrays and stuff, which just
            // breaks everything and gives a "Cannot convert object to primitive value"
            // error
            return joinedValue
        }

        return ret
    }
    Array.prototype.join = tracedArrayJoin

    Array.prototype.indexOf = function(value){
        // We want to treat String objects as strings, because String("a") === "a",
        // but don't call toString on objects
        function specialToString(maybeString){
            var maybeString = stringTraceUseValue(maybeString);
            if (maybeString instanceof nativeStringObject || maybeString instanceof window.String) {
                maybeString = toString(value)
            }
            return maybeString
        }

        var arrayItems = this.map(specialToString)
        return nativeArrayIndexOf.apply(arrayItems, [specialToString(value)])
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

            var textNode = null;
            if (el.nodeType === Node.TEXT_NODE) {
                textNode = el;
            } else {
                addElOrigin(el, "replaceContents", el.childNodes)
                if (newTextContent.toString() !== ""){
                    textNode = el.childNodes[0];
                    el.__elOrigin.contents = [textNode]
                }
            }

            if (textNode !== null) {
                addElOrigin(textNode, "textValue", {
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

    Number.prototype.toFixed = function(digits){
        var str = nativeNumberToFixed.call(this, digits);
        return makeTraceObject({
            value: str,
            origin: new Origin({
                value: str,
                action: "Number ToFixed",
                inputValues: [this, digits]
            })
        })
    }

    Number.prototype.toString = function trackedNumberToString(radix){
        var str = nativeNumberToString.apply(this, arguments)
        // makeTraceObject uses map which stringifies numbers,
        // so disable tracing to prevent infinite recursion
        Number.prototype.toString = nativeNumberToString
        var ret = makeTraceObject({
            value: str,
            origin: new Origin({
                value: str,
                action: "Number ToString",
                inputValues: [this]
            })
        })
        Number.prototype.toString = trackedNumberToString
        return ret;
    }

    Object.defineProperty(Element.prototype, "outerHTML", {
        get: function(){
            var outerHTML = nativeOuterHTMLDescriptor.get.apply(this, arguments)
            return makeTraceObject({
                value: outerHTML,
                origin: new Origin({
                    value: outerHTML,
                    action: "Read Element outerHTML",
                    inputValues: [this]
                })
            })
        }
    })

    Object.defineProperty(Element.prototype, "innerHTML", {
        set: function(innerHTML){
            var fromJSButton;
            if (this === document.body) {
                // body assignments by the app can overwrite the button,
                // so keep a reference and restore it later
                fromJSButton = document.querySelector(".fromjs-show-inspector-button")
            }
            var ret = nativeInnerHTMLDescriptor.set.call(this, toString(innerHTML))
            mapInnerHTMLAssignment(this, innerHTML, "Assign InnerHTML")
            if (fromJSButton){
                document.body.appendChild(fromJSButton)
            }
            return ret
        },
        get: function(){
            var innerHTML = nativeInnerHTMLDescriptor.get.apply(this, arguments)
            return makeTraceObject({
                value: innerHTML,
                origin: new Origin({
                    value: innerHTML,
                    action: "Read Element innerHTML",
                    inputValues: [this]
                })
            })
        }
    })

    function copyElOriginsToClonedNode(el, clone){
        clone.__elOrigin = el.__elOrigin
        for (var i=0; i<el.childNodes.length; i++) {
            copyElOriginsToClonedNode(el.childNodes[i], clone.childNodes[i])
        }
    }
    Node.prototype.cloneNode = function(deep){
        var clone = nativeCloneNode.apply(this, [deep]);
        if (!deep){
            clone.__elOrigin = this.__elOrigin
        } else {
            copyElOriginsToClonedNode(this, clone)
        }
        return clone
    }

    HTMLElement.prototype.insertAdjacentHTML = function(position, html){
        position = position.toString()
        if (position !== "afterBegin") {
            console.log("Not tracing insertAdjacentHTML at", position)
            return nativeHTMLElementInsertAdjacentHTML.apply(this, arguments)
        }

        var el = this;

        var childNodesBefore = Array.from(el.childNodes)
        var ret = nativeHTMLElementInsertAdjacentHTML.apply(el, arguments)

        mapInnerHTMLAssignment(el, html, "InsertAdjacentHTML", undefined, undefined, childNodesBefore)

        return ret
    }

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

    Object.defineProperty(HTMLInputElement.prototype, "value", {
        get: function(){
            var res = nativeHTMLInputElementValueDescriptor.get.apply(this, arguments)
            return makeTraceObject({
                value: res,
                origin: new Origin({
                    action: "HTMLInputElement Value",
                    value: res,
                    inputValues: []
                })
            })
        },
        set: function(value){
            var ret = nativeHTMLInputElementValueDescriptor.set.apply(this, arguments)
            addElOrigin(this, "attribute_value", {
                action: "Input Set Value",
                inputValues: [value],
                value: ' value="' + value + '"'
            })
            return ret;
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

    RegExp.prototype.exec = function(str){
        var args = unstringTracifyArguments(arguments)
        var res = nativeExec.apply(this, args)
        if (res === null) {
            return res;
        }
        if (str === null || str === undefined){
            str = "" + str // convert to string
        }
        if (!str.isStringTraceString) {
            str = makeTraceObject({
                value: str,
                origin: new Origin({
                    value: str,
                    action: "Untracked RegExp.exec parameter",
                    inputValues: []
                })
            });
        }

        var matchValue = res[0]
        var match = makeTraceObject({
            value: matchValue,
            origin: new Origin({
                action: "RegExp.exec Match",
                value: matchValue,
                inputValues: [str],
                inputValuesCharacterIndex: [res.index]
            })
        })

        res[0] = match

        var regExpString = this.toString();
        for (var i=1; i<res.length; i++){
            if (res[i] !== undefined) {
                var submatch = makeTraceObject({
                    value: res[i],
                    origin: new Origin({
                        value: res[i],
                        action: "RegExp.exec Submatch",
                        inputValues: [str],
                        // indexOf isn't very accurate but will have to do for now
                        inputValuesCharacterIndex: [res.index + matchValue.indexOf(res[i])]
                    })
                })
                res[i] = submatch
            }
        }

        return res;
    }


    function makeStyleDescriptor(nativeDescriptor) {
        return {
            get: function(){
                var style = nativeDescriptor.get.apply(this, arguments);
                // Make the CSSStyleDeclaration aware of its parent element
                style.__element = this;
                return style;
            },
            set: nativeDescriptor.set
        }
    }
    Object.defineProperty(HTMLElement.prototype, "style", makeStyleDescriptor(nativeHTMLElementStyleDescriptor))
    Object.defineProperty(SVGElement.prototype, "style", makeStyleDescriptor(nativeSVGElementStyleDescriptor))

    CSSStyleDeclaration.prototype.setProperty = function(name, value ,priority){
        if (!this.__element) {
            console.log("Untracked setProperty call")
            return nativeCSSStyleDeclarationSetProperty.apply(this, arguments)
        }

        var currentStyleValue = this.__element.getAttribute("style")
        if (currentStyleValue !== null && currentStyleValue !== ""){
            // setting styles and how they are serialized or not into
            // the style attribute is tricky, so I'm not going to bother for now
            console.log("Untracked setProperty call")
            return nativeCSSStyleDeclarationSetProperty.apply(this, arguments)
        }

        var styleValue = name.toString() + ": ";
        styleValue += value.toString();
        if (priority !== undefined && priority.toString() === "important") {
            styleValue += " !important"
        }

        addElOrigin(this.__element, "attribute_style", {
            action: "Style SetProperty",
            inputValues: [name, value, priority],
            value: " style='" + styleValue + "'"
        })

        nativeSetAttribute.apply(this.__element, ["style", styleValue])
    }

    Object.prototype.toString = function(){
        if (isTracedString(this)) {
            return nativeObjectToString.call(this.value)
        }
        return nativeObjectToString.call(this)
    }

    Array.prototype.toString = function(){
        if (isTracedString(this)) {
            return this
        }
        Array.prototype.join = nativeArrayJoin
        var ret = nativeArrayToString.call(this)
        Array.prototype.join = tracedArrayJoin
        return ret;
    }

    window.String = function(val){
        if (val !== undefined && val !== null) {
            val = toString(val);
        }
        return new nativeStringObject(val)
    }
    window.String.prototype = nativeStringObject.prototype
    window.String.raw = nativeStringObject.raw
    window.String.fromCodePoint = nativeStringObject.fromCodePoint
    window.String.fromCharCode = nativeStringObject.fromCharCode

    window.Function = function(code){
        var args = Array.prototype.slice.apply(arguments)
        var code = args.pop()
        code = removeSourceMapIfAny(code)
        var argsWithoutCode = args.slice()

        var id = _.uniqueId();
        var filename = "DynamicFunction" + id + ".js"

        var fnName = "DynamicFunction" + id
        code = f__add("function " + fnName + "(" + argsWithoutCode.join(",") + "){", code);
        code = f__add(code, "}")
        var res = processJavaScriptCodeWithTracingDisabled(stringTraceUseValue(code), {filename: filename})
        args.push(res.code)

        var smFilename = filename + ".map"
        var evalCode = res.code +
            "\n//# sourceURL=" + filename +
            "\n//# sourceMappingURL=" + smFilename

        // create script tag instead of eval to prevent strict mode from propagating
        // (I'm guessing if you call eval from code that's in strict mode  strict mode will
        // propagate to the eval'd code.)
        var script = document.createElement("script")
        script.innerHTML = evalCode
        document.body.appendChild(script)

        script.remove();

        registerDynamicFile(filename, code, evalCode, res.map, "Dynamic Function")

        return function(){
            return window[fnName].apply(this, arguments)
        }
    }
    window.Function.prototype = nativeFunction.prototype

    function registerDynamicFile(filename, code, evalCode, sourceMap, actionName){
        var smFilename = filename + ".map"
        code = trackStringIfNotTracked(code)

        dynamicCodeRegistry.register(smFilename, sourceMap)
        dynamicCodeRegistry.register(filename, evalCode)
        var codeOrigin = new Origin({
            action: actionName === undefined ? "Dynamic Script" : actionName,
            value: code.value,
            inputValues: [code.origin]
        })
        dynamicCodeRegistry.register(filename + ".dontprocess", code.value, codeOrigin)
    }

    document.write = function(str){
        var div = originalCreateElement.call(document, "div");
        div.innerHTML = str;
        var ret = nativeInnerHTMLDescriptor.set.call(div, toString(str))
        mapInnerHTMLAssignment(div, str, "Document.Write")

        var children = Array.from(div.children);
        children.forEach(function(child){
            document.body.appendChild(child)
        })

        var scriptTags = getScriptElements(str);
        scriptTags.forEach(function(scriptTag){
            document.body.appendChild(scriptTag)
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
    window.JSON.stringify = nativeJSONStringify
    document.createElement = window.originalCreateElement
    document.createElementNS = nativeCreateElementNS
    document.createComment = nativeCreateComment

    document.write = nativeDocumentWrite

    Object.defineProperty(Node.prototype, "appendChild", window.originalAppendChildPropertyDescriptor);
    Element.prototype.setAttribute = window.nativeSetAttribute
    Object.defineProperty(Element.prototype, "innerHTML", nativeInnerHTMLDescriptor)
    Object.defineProperty(Element.prototype, "outerHTML", nativeOuterHTMLDescriptor)
    Object.defineProperty(window, "localStorage", {
        get: function(){
            return window.originalLocalStorage
        }
    })
    Object.defineProperty(HTMLInputElement.prototype, "value", nativeHTMLInputElementValueDescriptor)
    RegExp.prototype.exec = window.nativeExec
    window.Function = nativeFunction
    Object.defineProperty(Element.prototype, "className", window.nativeClassNameDescriptor)
    Object.defineProperty(HTMLElement.prototype, "dataset", window.nativeDataSetDescriptor)
    Object.defineProperty(Node.prototype, "textContent", nativeNodeTextContentDescriptor)
    Object.defineProperty(HTMLScriptElement.prototype, "text", nativeHTMLScriptElementTextDescriptor)
    window.XMLHttpRequest = originalXMLHttpRequest
    Array.prototype.join = nativeArrayJoin
    Array.prototype.indexOf = nativeArrayIndexOf
    document.createTextNode = nativeCreateTextNode
    window.eval = nativeEval
    Node.prototype.cloneNode = nativeCloneNode
    Node.prototype.addEventListener =  nativeAddEventListener
    Node.prototype.removeEventListener = nativeRemoveEventListener

    CSSStyleDeclaration.prototype.setProperty =  nativeCSSStyleDeclarationSetProperty
    Object.defineProperty(HTMLElement.prototype, "style", nativeHTMLElementStyleDescriptor)
    Object.defineProperty(SVGElement.prototype, "style", nativeSVGElementStyleDescriptor)

    HTMLElement.prototype.insertAdjacentHTML = nativeHTMLElementInsertAdjacentHTML

    Object.prototype.toString = nativeObjectToString
    Number.prototype.toString = nativeNumberToString
    Array.prototype.toString = nativeArrayToString

    Number.prototype.toFixed = nativeNumberToFixed;

    window.String = nativeStringObject

    Object.getOwnPropertyNames = nativeObjectGetOwnPropertyNames
    Object.keys = nativeObjectKeys

    Object.prototype.hasOwnProperty = nativeObjectHasOwnProperty

    tracingEnabled = false;

    nativeStringFunctions.forEach(function(property) {
        String.prototype[property.name] = property.fn
    })

}

window._disableTracing = disableTracing

import addElOrigin from "./addElOrigin"
import unstringTracifyArguments from "./unstringTracifyArguments"
import makeTraceObject from "./makeTraceObject"
import Origin from "../origin"
import _ from "underscore"

window.fromJSDynamicFiles = {}
window.fromJSDynamicFileOrigins = {}

export function enableTracing(){
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
                value: " class='" + newValue.toString() + "'",
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
                    origin: new Origin({
                        value: parsedVal[key],
                        inputValues: [str],
                        inputValuesCharacterIndex: [str.toString().indexOf(parsedVal[key])], // not very accurate, but better than nothing/always using char 0
                        action: "JSON.parse",
                        actionDetails: key
                    })
                }
            )
        }

        return parsedVal
    }

    var nativeInnerHTMLDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML");
    window.nativeInnerHTMLDescriptor = nativeInnerHTMLDescriptor;
    Object.defineProperty(Element.prototype, "innerHTML", {
        set: nativeInnerHTMLDescriptor.set,
        get: function(){
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


    var nativeLocalStorageGetItem = localStorage.getItem
    window.nativeLocalStorageGetItem = nativeLocalStorageGetItem
    localStorage.getItem = function(key){
        var val = nativeLocalStorageGetItem.apply(this, arguments)
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

        var id = _.uniqueId();
        var filename = "DynamicFunction" + id + ".js"
        var res = stringTraceCompile(stringTraceUseValue(code), {filename: filename})
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

        fromJSDynamicFiles[smFilename] = res.map
        fromJSDynamicFiles[filename] = evalCode
        fromJSDynamicFiles[filename + "?dontprocess=yes"] = code.value
        fromJSDynamicFileOrigins[filename + "?dontprocess=yes"] = code.origin

        return function(){
            return window[fnName].apply(this, arguments)
        }
    }

    window.nativeJSONParse = nativeJSONParse

}


export function disableTracing(){
    window.JSON.parse = window.nativeJSONParse
    document.createElement = window.originalCreateElement
    Object.defineProperty(Node.prototype, "appendChild", window.originalAppendChildPropertyDescriptor);
    Element.prototype.setAttribute = window.nativeSetAttribute
    localStorage.getItem = window.nativeLocalStorageGetItem;
}

window._disableTracing = disableTracing

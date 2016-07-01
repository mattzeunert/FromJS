import addElOrigin from "./addElOrigin"
import unstringTracifyArguments from "./unstringTracifyArguments"
import makeTraceObject from "./makeTraceObject"
import Origin from "../origin"
import _ from "underscore"

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
        var script = document.createElement("script")

        var fnName = "DynamicFunction" + id
        var smFilename = filename + ".map"
        script.innerHTML = "function " + fnName + "(" + argsWithoutCode.join(",") + "){" + res.code + "}" + "\n//# sourceURL=" + filename + "\n//# sourceMappingURL=" + smFilename
        script.setAttribute("sm", encodeURIComponent(JSON.stringify(res.map)))
        script.setAttribute("sm-filename", smFilename)
        script.setAttribute("fn", fnName)
        script.setAttribute("original-source", encodeURIComponent(code))
        script.className = "string-trace-fn";

        script.originalCodeForDebugging = code

        document.body.appendChild(script)



        return function(){
            return window[fnName].apply(this, arguments)
        }
        // return nativeFunction.apply(this, args)
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

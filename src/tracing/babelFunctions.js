import stringTraceUseValue from "./stringTraceUseValue"
import StringTraceString, {makeTraceObject} from "./FromJSString"
import Origin from "../origin"
import untrackedString from "./untrackedString"
import untrackedPropertyName from "./untrackedPropertyName"
import toString from "../untracedToString"

var globalObject = (function () { return this; })();

var cachedValue;

function ensureIsNumber(value){
    if (typeof value === "number") {
        return value
    }
    if (typeof value === "undefined") {
        return NaN
    }
    if (value === null){
        return 0
    }

    var num = parseFloat(value.toString())
    if (num === 0 && 1 / value === Number.NEGATIVE_INFINITY){
        num = -0;
    }

    return num;
}

var babelFunctions = {
    f__StringLiteral(value){
        // return value
        return makeTraceObject({
            value: value,
            origin: new Origin({
                action: "String Literal",
                value: value,
                inputValues: []
            }),
        })
    },
    f__typeof(a){
        if (a && a.isStringTraceString) {
            // rather confusingly a FromJSString can have a non string value...
            return typeof a.value
        }
        return typeof a
    },
    f__useValue(thing){
        return stringTraceUseValue(thing)
    },
    f__useValueAsPropertyKey(thing) {
        var ret = thing
        if (typeof thing !== "symbol") {
            ret = toString(babelFunctions.f__useValue(thing), true)
        }
        /*
        try {
            var obj = {}
            obj[thing] = 123
            if (obj[ret] !== 123) {
                debugger
            }
        } catch (err) {
            // hmm... i guess this is fine and it means the f__useValueAsPropertyKey call was necessary
        }
        */

        return ret
    },
    f__add(a, b){
        var aIsString = typeof a === "string" || (a !== null && typeof a === "object" && a.isStringTraceString)
        var bIsString = typeof b === "string" || (b !== null && typeof b === "object" && b.isStringTraceString)
        var involvesStrings = aIsString || bIsString;

        if (!involvesStrings){
            return a + b;
        }

        var error = Error();
        if (aIsString && !a.isStringTraceString){
            a = untrackedString(a, error);
        }
        if (bIsString && !b.isStringTraceString){
            b = untrackedString(b, error);
        }

        var newValue = toString(a, true) + toString(b, true);

        var inputValues = [a, b];

        return makeTraceObject({
            value: newValue,
            origin: new Origin({
                action: "Concat",
                value: newValue,
                inputValues,
                error
            })
        })
    },
    f__divide(a,b){
        return ensureIsNumber(a) / ensureIsNumber(b);
    },
    f__multiply(a,b){
        return ensureIsNumber(a) * ensureIsNumber(b);
    },
    f__subtract(a,b){
        return ensureIsNumber(a) - ensureIsNumber(b);
    },
    f__notTripleEqual(a,b){
        if (a && a.isStringTraceString) {
            a = a.toString()
        }
        if (a === window.Object){
            a = nativeObjectObject;
        }
        if(b && b.isStringTraceString) {
            b = b.toString()
        }
        if (b === window.Object){
            b = window.nativeObjectObject
        }
        return a !== b;
    },
    f__tripleEqual(a,b){
        var ret = !babelFunctions.f__notTripleEqual(a,b)
        return ret
    },
    f__notDoubleEqual(a,b){
        // Error.stackTraceLimit = 500;
        // const l = Error().stack.split("\n").length
        // if (l > 20) console.log(l)
        // console.log("not double equal", a, b, l)

        // console.log(Error().stack + "s")
        // if (l > 3) {debugger}

        if (a && a.isStringTraceString) {
            a = a.toString()
        }
        if (a === window.Object){
            a = nativeObjectObject
        }
        if(b && b.isStringTraceString) {
            b = b.toString();
        }
        if (b === window.Object){
            b = nativeObjectObject
        }
        if (typeof a === "string" || typeof b === "string") {
            // Make sure they're both strings,
            // avoid implicit toString call when comparing, could cause
            // 'Cannot convert object to primitive type'
            if (a !== undefined && a !== null) {
                a = toString(a)
            }
            if (b !== undefined && b !== null) {
                b = toString(b)
            }
        }
        return a != b;
    },
    f__doubleEqual(a,b){
        var ret = !babelFunctions.f__notDoubleEqual(a,b)
        return ret
    },
    f__not(val){
        return !stringTraceUseValue(val)
    },
    f__setCachedValue(val){
        cachedValue = val
        return val
    },
    f__getCachedValue(val){
        return cachedValue
    },
    f__assign(object, propertyName, value){
        var propertyNameString = toString(propertyName, true);
        var storagePropName = propertyNameString + "_trackedName";

        // This would be a nice to have, but
        // 1) it costs a lot of memory
        // 2) it's not something that happens to the string,
        //    it just shows where the string is used/
        // property = makeTraceObject({
        //     value: property,
        //     origin: new Origin({
        //         value: property,
        //         inputValues: [property],
        //         action: "Property Assignment"
        //     })
        // })

        var propertyNameType = typeof propertyName;
        // Either Symbol() or Object(Symbol())
        var propertyNameIsSymbol = propertyNameType === "symbol" || propertyNameString === "Symbol()"
        if (!propertyNameIsSymbol) {
            if (propertyName === null
                || propertyName === undefined
                || (propertyNameType !== "string" && !propertyName.isStringTraceString)) {
                propertyName = propertyNameString;
            }
        }

        if (object[storagePropName] === undefined){
            Object.defineProperty(object, storagePropName, {
                value: propertyName,
                enumerable: false,
                writable: true
            })
        } else {
            object[storagePropName] = propertyName
        }

        try {
            object[propertyName] = value
        } catch (err) {
            var acceptableErrors = [
                "TypeError: Cannot assign to read only property 'prototype' of function 'function Promise() { [native code] }'"
            ]

            var isntAcceptable = acceptableErrors.indexOf(err.toString()) === -1
            if (isntAcceptable) {
                throw err
            }
        }

        return value;
    },
    f__getTrackedPropertyName(object, propertyName){
        var trackedPropertyName = object[propertyName + "_trackedName"]

        if (!trackedPropertyName) {
            return untrackedPropertyName(propertyName)
        }
        return trackedPropertyName
    },
    f__makeObject(properties){
        var obj = {}
        var methodProperties = {};
        for (var i=0; i< properties.length ;i++){
            var property =  properties[i]
            var propertyType = property[0]
            var propertyKey = property[1]
            if (propertyType === "ObjectProperty") {
                f__assign(obj, property[1], property[2])
            } else if (propertyType === "ObjectMethod") {
                var propertyKind = property[2]
                var fn = property[3]
                if (!methodProperties[propertyKey]){
                    methodProperties[propertyKey] = {
                        enumerable: true,
                        configurable: true
                    }
                }
                methodProperties[propertyKey][propertyKind] = fn

            }
        }
        Object.defineProperties(obj, methodProperties)
        return obj
    },
    f__getForInLoopKeyObject(object){
        return f__useValue(object);
    },
    f__getPathname(obj) {
        if (obj !== location) {
            return obj.pathname;
        } 

        return makeTraceObject({
            value: obj.pathname,
            origin: new Origin({
                action: "location.pathname",
                value: obj.pathname,
                inputValues: []
            })
        })
    },
    f__getToString(obj){
        if (obj && obj.isStringTraceString) {
            return function(){
                // Return the object itself rather than native string
                return obj;
            }
        } else {
            var objToString = obj.toString
            return function(){
                var calledWithCallOrApply = this !== globalObject;
                if (calledWithCallOrApply){
                    var ret = objToString.apply(this, arguments)
                } else {
                    var ret = objToString.apply(obj, arguments)
                }
                return ret;
            }
        }
    }
}

export default babelFunctions

export function addBabelFunctionsToGlobalObject(){
    Object.keys(babelFunctions).forEach(function(functionName){
        window[functionName] = babelFunctions[functionName]
    })
}
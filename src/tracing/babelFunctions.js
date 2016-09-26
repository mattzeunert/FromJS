import stringTraceUseValue from "./stringTraceUseValue"
import StringTraceString, {makeTraceObject} from "./FromJSString"
import Origin from "../origin"
import untrackedString from "./untrackedString"
import untrackedPropertyName from "./untrackedPropertyName"
import toString from "../untracedToString"


var cachedValue;

function ensureIsNumber(value){
    if (typeof value === "number") {
        return value
    }
    if (typeof value === "undefined") {
        return NaN
    }

    return parseFloat(value.toString())
}

var babelFunctions = {
    f__StringLiteral(value){
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
    f__add(a, b){
        var aIsNumberOrBoolean = typeof a === "number" || typeof a === "boolean"
        if (aIsNumberOrBoolean) {
            var bIsNumberOrBoolean = typeof b === "number" || typeof b === "boolean"
            if (bIsNumberOrBoolean) {
                return a + b;
            }
        }

        if (a == null){
            a = ""
        }
        if (b==null){
            b = ""
        }
        if (!a.isStringTraceString && typeof a === "string"){
            a = untrackedString(a);
        }
        if (!b.isStringTraceString && typeof b === "string"){
            b = untrackedString(b);
        }

        var newValue = toString(a) + toString(b);

        var inputValues = [a, b];

        return makeTraceObject({
            value: newValue,
            origin: new Origin({
                action: "Concat",
                value: newValue,
                inputValues
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
        if(b && b.isStringTraceString) {
            b = b.toString()
        }
        return a !== b;
    },
    f__tripleEqual(a,b){
        var ret = !babelFunctions.f__notTripleEqual(a,b)
        return ret
    },
    f__notDoubleEqual(a,b){
        if (a && a.isStringTraceString) {
            a = a.toString()
        }
        if(b && b.isStringTraceString) {
            b = b.toString();
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
    f__assign(object, property, value){
        var storagePropName = toString(property, true) + "_trackedName"

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

        if (object[storagePropName] === undefined){
            Object.defineProperty(object, storagePropName, {
                value: property,
                enumerable: false,
                writable: true
            })
        } else {
            object[storagePropName] = property
        }

        return object[property] = value
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
        for (var i=0; i< properties.length ;i++){
            var property =  properties[i]
            f__assign(obj, property[0], property[1])
        }
        return obj
    }

}

export default babelFunctions

export function addBabelFunctionsToGlobalObject(){
    Object.keys(babelFunctions).forEach(function(functionName){
        window[functionName] = babelFunctions[functionName]
    })
}

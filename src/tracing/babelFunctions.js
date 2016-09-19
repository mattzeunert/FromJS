import stringTraceUseValue from "./stringTraceUseValue"
import StringTraceString, {makeTraceObject} from "./FromJSString"
import Origin from "../origin"
import untrackedString from "./untrackedString"
import untrackedPropertyName from "./untrackedPropertyName"


var cachedValue;

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

        var newValue = a.toString() + b.toString();
        return makeTraceObject({
            value: newValue,
            origin: new Origin({
                action: "Concat",
                value: newValue,
                inputValues: [a, b]
            })
        })
    },
    f__notTripleEqual(a,b){
        if (a && a.isStringTraceString) {
            a = a.toString()
        }
        if(b && b.isStringTraceString) {
            b = b.toString();
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
        if (typeof property === "undefined") {
            property = "undefined"
        }
        var storagePropName = property.toString() + "_trackedName"

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

import Origin from "../origin"
import ValueMap from "../value-map"
import unstringTracifyArguments from "./unstringTracifyArguments"

export default function StringTraceString(options){
    this.origin = options.origin
    this.value = options.value
    this.isStringTraceString = true
}

function isArray(val){
    return val.length !== undefined && val.map !== undefined;
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
                return new Origin({
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
                        origin: new Origin({
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
                                origin: new Origin({
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

export function makeTraceObject(options){
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

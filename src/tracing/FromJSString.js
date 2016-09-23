import Origin from "../origin"
import ValueMap from "../value-map"
import unstringTracifyArguments from "./unstringTracifyArguments"
import stringTraceUseValue from "./stringTraceUseValue"
import untrackedArgument from "./untrackedArgument"
import config from "../config"
import toString from "../untracedToString"

function FromJSString(options){
    var value = options.value
    while(value.isStringTraceString) {
        value = value.value
    }

    // Properties need to be non enumerable so they don't show up in
    // for...in loops
    Object.defineProperties(this, {
        origin: {
            enumerable: false,
            writable: true,
            value: options.origin
        },
        value: {
            enumerable: false,
            writable: true,
            value: value
        },
        isStringTraceString: {
            enumerable: false,
            writable: false,
            value: true
        }
    })

    if (typeof this.value !== "string") {
        debugger
    }
}

function isArray(val){
    return val !== null && val.length !== undefined && val.map !== undefined;
}

function capitalizeFirstCharacter(str){
    return str.slice(0, 1).toUpperCase() + str.slice(1)
}

function countGroupsInRegExp(re){
    // http://stackoverflow.com/questions/16046620/regex-to-count-the-number-of-capturing-groups-in-a-regex
    return new RegExp(re.toString() + '|').exec('').length
}

// getOwnPropertyNames instead of for loop b/c props aren't enumerable
Object.getOwnPropertyNames(String.prototype).forEach(function(propertyName){
    if (propertyName === "toString") { return }
    // can't use .apply on valueOf function (" String.prototype.valueOf is not generic")
    if (propertyName === "valueOf") { return }
    if (typeof String.prototype[propertyName] === "function") {
        FromJSString.prototype[propertyName] = function(){
            var oldValue = this;
            var args = unstringTracifyArguments(arguments)
            var newVal;

            var argumentOrigins = Array.from(arguments).map(function(arg){
                if (arg instanceof FromJSString) {
                    return arg.origin;
                }
                if (typeof arg === "string"){
                    return untrackedArgument(arg)
                }
                var str = toString(arg, true)
                return {
                    value: str,
                    origin: new Origin({
                        error: {stack: ""},
                        inputValues: [],
                        value: str
                    })
                }
            })
            var inputValues = [oldValue.origin].concat(argumentOrigins)

            var valueItems = null;
            if (propertyName === "replace") {
                var oldString = oldValue.toString()

                var valueMap = new ValueMap();
                var inputMappedSoFar = ""

                var newVal = oldString.replace(args[0], function(){
                    var argumentsArray = Array.prototype.slice.apply(arguments, [])
                    var match = argumentsArray[0];
                    var submatches = argumentsArray.slice(1, argumentsArray.length - 2)
                    var offset = argumentsArray[argumentsArray.length - 2]
                    var string = argumentsArray[argumentsArray.length - 1]

                    submatches = submatches.map(function(submatch){
                        if (typeof submatch !== "string"){
                            return submatch
                        }

                        return makeTraceObject({
                            value: submatch,
                            origin: new Origin({
                                value: submatch,
                                action: "Replace Call Submatch",
                                inputValues: [oldValue],
                                inputValuesCharacterIndex: [offset + match.indexOf(submatch)]
                            })
                        })
                    })

                    var newArgsArray = [
                        match,
                        ...submatches,
                        offset,
                        string
                    ];

                    var inputBeforeToKeep = oldString.substring(inputMappedSoFar.length, offset)
                    valueMap.appendString(inputBeforeToKeep , oldValue.origin, inputMappedSoFar.length)
                    inputMappedSoFar += inputBeforeToKeep

                    var replaceWith = null;
                    // confusing... args[1] is basically inputValues[2].value
                    if (typeof args[1] === "string" || typeof args[1] === "number") {
                        var value = args[1].toString();
                        value = value.replace(/\$([0-9]{1,2}|[$`&'])/g, function(dollarMatch, dollarSubmatch){
                            var submatchIndex = parseFloat(dollarSubmatch)
                            if (!isNaN(submatchIndex)){
                                var submatch = submatches[submatchIndex - 1] // $n is one-based, array is zero-based
                                if (submatch === undefined) {
                                    var maxSubmatchIndex = countGroupsInRegExp(args[0])
                                    var submatchIsDefinedInRegExp = submatchIndex < maxSubmatchIndex

                                    if (submatchIsDefinedInRegExp) {
                                        submatch = ""
                                    } else {
                                        submatch = "$" + dollarSubmatch
                                    }
                                }
                                return submatch
                            } else if (dollarSubmatch === "&"){
                                return match
                            } else {
                                throw "not handled!!"
                            }
                        })

                        replaceWith = {
                            value: value,
                            origin: inputValues[2]
                        }
                    } else if (typeof args[1] === "function"){
                        replaceWith = args[1].apply(this, newArgsArray)
                        if (!replaceWith.origin) {
                            replaceWith = makeTraceObject({
                                value: replaceWith,
                                origin: {
                                    value: replaceWith,
                                    action: "Untracked replace match result",
                                    inputValues: []
                                }
                            })
                        } else {
                            replaceWith = {
                                value: replaceWith.value,
                                origin: replaceWith.origin
                            }
                        }
                    } else {
                        throw "not handled"
                    }
                    valueMap.appendString(replaceWith.value, replaceWith.origin, 0)


                    inputMappedSoFar += match

                    return replaceWith.value
                })

                valueMap.appendString(oldString.substring(inputMappedSoFar.length), oldValue.origin, inputMappedSoFar.length)

                valueItems = valueMap.serialize(inputValues)

            } else if (propertyName === "slice"){
                var oldString = oldValue.toString()

                var valueMap = new ValueMap();
                var from = args[0]
                var to = args[1]

                if (to < 0) {
                    to = oldString.length + to;
                }

                newVal = oldString.slice(from, to)

                valueMap.appendString(newVal, oldValue.origin, from) // oldvalue.origin is inputValues[0]

                valueItems = valueMap.serialize(inputValues)
            } else if (propertyName === "substr"){
                var oldString = oldValue.toString();
                var start = args[0]
                if (start < 0){
                    start = oldString.length + start
                }
                var length = args[1]
                if (length === undefined){
                    length = oldString.length - start;
                }

                newVal = oldString.substr(start, length)
                var valueMap = new ValueMap()
                valueMap.appendString(newVal, oldValue.origin, start)
                valueItems = valueMap.serialize(inputValues)

            } else if (propertyName === "match") {
                var regExp = args[0]
                if (regExp.global) {
                    var matches = [];
                    var match;
                    while (match = regExp.exec(this)) {
                        matches.push(match[0])
                    }
                    if (matches.length === 0) {
                        return null;
                    }
                    return matches
                } else {
                    return regExp.exec(this)
                }
            } else {
                if (config.logUntrackedStrings) {
                    console.trace("string not tracked after ",propertyName ,"call")
                }
                newVal = nativeStringObject.prototype[propertyName].apply(this.toString(), args);
            }

            var actionName = capitalizeFirstCharacter(propertyName) + " Call";

            if (typeof newVal === "string") {
                return makeTraceObject(
                    {
                        value: newVal,
                        origin: new Origin({
                            value: newVal,
                            valueItems: valueItems,
                            inputValues: inputValues,
                            action: actionName
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
                                    action: actionName,
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
FromJSString.prototype.valueOf = function(){
    return this.value;
}
FromJSString.prototype.toString = function(){
    return this.value
}
FromJSString.prototype.toJSON = function(){
    return this.value
}
Object.defineProperty(FromJSString.prototype, "length", {
    get: function(){
        return this.value.length;
    }
})

export function makeTraceObject(options){
    if (typeof options.value !== "string") {
        return options.value
    }
    if (options === undefined || options.value === undefined || options.origin === undefined) {
        throw "invalid options for makeTraceObject"
    }
    var stringTraceObject = new FromJSString({
        value: stringTraceUseValue(options.value),
        origin: options.origin
    })
    if (stringTraceObject.value.isStringTraceString) {
        debugger
    }

    // Make accessing characters by index work
    return new Proxy(stringTraceObject, {
        get: function(target, name){
            if (typeof name !== "symbol" && !isNaN(parseFloat(name))) {
                return target.value[name]
            }

            return stringTraceObject[name]
        }
    });
}

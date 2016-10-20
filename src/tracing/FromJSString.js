import Origin from "../origin"
import ValueMap from "../value-map"
import unstringTracifyArguments from "./unstringTracifyArguments"
import stringTraceUseValue from "./stringTraceUseValue"
import untrackedArgument from "./untrackedArgument"
import config from "../config"
import toString from "../untracedToString"
import cloneRegExp from "clone-regexp"
import debuggerStatementFunction from "../debuggerStatementFunction"

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
        }
    })
}
Object.defineProperty(FromJSString.prototype, "isStringTraceString", {
    value: true,
    enumerable: false
})

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

    // these return numbers
    if (propertyName === "indexOf" || propertyName === "lastIndexOf"
        || propertyName === "charCodeAt" || propertyName === "localeCompare"
        || propertyName === "search") {
        return;
    }

    if (typeof String.prototype[propertyName] === "function") {
        Object.defineProperty(FromJSString.prototype, propertyName, {
            value: handlerFunction,
            enumerable: false
        })

        function handlerFunction(){
            var oldValue = this;
            var args = unstringTracifyArguments(arguments)
            var newVal;
            var error = Error();

            var argumentOrigins = Array.from(arguments).map(function(arg){
                if (arg instanceof FromJSString) {
                    return arg.origin;
                }
                if (typeof arg === "string"){
                    return untrackedArgument(arg, error)
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

            var oldString = oldValue.toString()

            var valueItems = null;
            if (propertyName === "replace") {
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
                                error,
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
                        if (replaceWith === undefined){
                            replaceWith = "undefined"
                        }
                        if (replaceWith === null) {
                            replaceWith = "null"
                        }
                        if (!replaceWith.origin) {
                            replaceWith = makeTraceObject({
                                value: toString(replaceWith),
                                origin: new Origin({
                                    error,
                                    value: toString(replaceWith),
                                    action: "Untracked replace match result",
                                    inputValues: []
                                })
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
                var start = args[0]
                if (start < 0){
                    start = oldString.length + start
                }
                let length = args[1]
                if (length === undefined){
                    length = oldString.length - start;
                }

                newVal = oldString.substr(start, length)
                var valueMap = new ValueMap()
                valueMap.appendString(newVal, oldValue.origin, start)
                valueItems = valueMap.serialize(inputValues)

            } else if (propertyName === "substring"){
                var start = args[0]
                var end = args[1]

                if (start < 0 || isNaN(start)) {
                    start = 0;
                }
                if (end < 0 || isNaN(end)) {
                    end = oldString.length;
                }

                newVal = oldString.substring(start, end)
                var valueMap = new ValueMap()
                valueMap.appendString(newVal, oldValue.origin, start)
                valueItems = valueMap.serialize(inputValues)
            } else if (propertyName === "match") {
                var regExp = args[0]
                if (! (regExp instanceof RegExp)) {
                    regExp = new RegExp(regExp)
                }
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
            } else if (propertyName === "split") {
                var separator = args[0]
                var limit = args[1]
                if (limit !== undefined) {
                    dontTrack()
                } else {
                    var res = oldString.split(args[0])

                    var separators = [];
                    if (typeof separator === "string") {
                        for (var i=0; i< res.length -1; i++) {
                            separators.push(separator)
                        }
                    } else if (separator instanceof RegExp) {
                        var regExp = cloneRegExp(separator, {global: true})
                        separators = oldString.match(regExp)
                        if (separators === null) {
                            separators = [];
                        }
                    } else {
                        debuggerStatementFunction();
                        dontTrack();
                    }

                    newVal = []
                    var currentCharIndex = 0;
                    res.forEach(function(str, i){
                        var inputValuesCharacterIndex = [currentCharIndex];
                        currentCharIndex += str.length;
                        if (separators[i]) {
                            currentCharIndex += separators[i].length;
                        }

                        newVal.push(makeTraceObject({
                            value: str,
                            origin: new Origin({
                                error,
                                value: str,
                                action: "Split Call",
                                inputValues,
                                inputValuesCharacterIndex
                            })
                        }))
                    })
                }
            } else {
                dontTrack()
            }

            function dontTrack(){
                if (config.logUntrackedStrings) {
                    console.trace("string not tracked after ",propertyName ,"call")
                }

                newVal = nativeStringObject.prototype[propertyName].apply(oldString, args);
            }

            var actionName = capitalizeFirstCharacter(propertyName) + " Call";

            if (typeof newVal === "string") {
                return makeTraceObject(
                    {
                        value: newVal,
                        origin: new Origin({
                            error,
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
                                    error,
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
                // this should not really happen, although I've possibly
                // missed some functions that return numbers
                debuggerStatementFunction()
                return newVal
            }
        }
    }
})

Object.defineProperties(FromJSString.prototype, {
    valueOf: {
        value: function(){
            return this.value;
        },
        enumerable: false
    },
    toJSON: {
        value: function(){
            return this.value
        },
        enumerable: false
    },
    toString: {
        value: function(){
            return this.value
        },
        enumerable: false
    },
    indexOf: {
        value: function(search, fromIndex){
            if (search && search.isStringTraceString) {
                search = search.value
            }
            return this.value.indexOf(search, fromIndex)
        },
        enumerable: false
    },
    lastIndexOf: {
        value: function(search, fromIndex){
            if (search && search.isStringTraceString) {
                search = search.value
            }
            return this.value.lastIndexOf(search, fromIndex)
        },
        enumerable: false
    },
    charCodeAt: {
        value: function(index){
            return this.value.charCodeAt(index)
        },
        enumerable: false
    },
    search: {
        value: function(index){
            return this.value.search(index)
        },
        enumerable: false
    },
    localeCompare: {
        value: function(){
            return this.value.localeCompare.apply(this.value, arguments)
        },
        enumerable: false
    }
})
Object.defineProperty(FromJSString.prototype, "length", {
    get: function(){
        return this.value.length;
    }
})

var traps = {
    get: function(target, name){
        if (typeof name !== "symbol" && !isNaN(name)) {
            return target.value[name]
        }

        if (name === "constructor") {
            return window.String
        }

        return target[name]
    },
    has: function(target, propName){
        throw new TypeError("Cannot use 'in' operator to search for '" + propName +"' in " + target.value)
    }
}

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
        debuggerStatementFunction()
    }

    // Make accessing characters by index work
    return new Proxy(stringTraceObject, traps);
}

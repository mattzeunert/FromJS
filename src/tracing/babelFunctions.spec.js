import babelFunctions from "./babelFunctions"
import {makeTraceObject} from "./FromJSString"

describe("babelFunctions", function(){
    describe("f__add", function(){
        it("Supports adding a string to an object", function(){
            var obj = {
                toString: () => "obj"
            }
            var res = babelFunctions.f__add(obj, "sth")
            expect(res.value).toBe("objsth")
            expect(res.origin.inputValues[0]).not.toBe(undefined)
            expect(res.origin.inputValues[1]).not.toBe(undefined)
        })
        it("Doesn't break adding two numbers together", function(){
            var res = babelFunctions.f__add(1,2)
            expect(res).toBe(3)
        })
        it("Supports adding booleans", function(){
            var res = babelFunctions.f__add(false, true)
            expect(res).toBe(1)
        })
        it("Supports adding booleans and numbers", function(){
            var res = babelFunctions.f__add(3, true)
            expect(res).toBe(4)
        })
        it("Supports null", function(){
            expect(babelFunctions.f__add("-", null).value).toBe("-null")
            expect(babelFunctions.f__add(null, "-").value).toBe("null-")
            expect(babelFunctions.f__add(null, null)).toBe(0)
        })
        it("Supports undefined", function(){
            expect(isNaN(babelFunctions.f__add(undefined, undefined))).toBe(true)
            expect(babelFunctions.f__add("-", undefined).value).toBe("-undefined")
        })
    })

    describe("f__getToString", function(){
        it("returned function returns the tracked value when passed a tracked value", function(){
            var str = makeTraceObject({
                value: "a",
                origin: {}
            })
            expect(babelFunctions.f__getToString(str)()).toBe(str)
        })
        it("returned function returns the value's tostring method if something other than a tracked value is passed in", function(){
            expect(babelFunctions.f__getToString(5)()).toBe("5")
            expect(babelFunctions.f__getToString(3)(2)).toBe("11")
            expect(babelFunctions.f__getToString({})()).toBe("[object Object]")
        })
        it("returned function uses the correct context when called with .call or .apply", function(){
            var toString = babelFunctions.f__getToString(5)
            expect(toString()).toBe("5")
            expect(toString.call(11)).toBe("11")
        })
        it("Uses the old object toString function if obj.toString changes after toString was accessed", function(){
            var toString1 = function(){ return "abc" }
            var toString2 = function(){ return "xyz" }
            var obj = { toString: toString1 }
            var toString = babelFunctions.f__getToString(obj)
            obj.toString = toString2
            expect(toString()).toBe("abc")
        })
    })

    describe("f__tripleEqual", function(){
        it("Knowns that traced 'a' and traced 'a' are equal", function(){
            var a = makeTraceObject({
                value: 'a',
                origin: null
            })
            var b = makeTraceObject({
                value: 'a',
                origin: null
            })
            var res = babelFunctions.f__tripleEqual(a, b)
            expect(res).toBe(true)
        })
        it("Knowns that traced 'a' and traced 'b' are not equal", function(){
            var a = makeTraceObject({
                value: 'a',
                origin: null
            })
            var b = makeTraceObject({
                value: 'b',
                origin: null
            })
            var res = babelFunctions.f__tripleEqual(a, b)
            expect(res).toBe(false)
        })
        it("Knows that nativeStringObject('a') and 'a' are equal", function(){
            var a = nativeStringObject("a")
            var res = babelFunctions.f__tripleEqual(a, "a")
            expect(res).toBe(true)
        })
        it("Knows that a traced '' is a traced '' are equal", function(){
            var empty1 = makeTraceObject({
                value: '',
                origin: null
            })
            var empty2 = makeTraceObject({
                value: '',
                origin: null
            })
        })
    })

    describe("f__subtract", function(){
        it("Supports subtracting undfined from a number", function(){
            var result = babelFunctions.f__subtract(5,  undefined)
            expect(isNaN(result)).toBe(true)
        })
    })

    describe("f__divide", function(){
        it("Maintains the sign when dividing by -0", function(){
            var result = babelFunctions.f__divide(5, -0)
            expect(result).toEqual(Number.NEGATIVE_INFINITY)
        })

        it("Maintains the sign when dividing by Number(-0)", function(){
            var result = babelFunctions.f__divide(5, Number(-0))
            expect(result).toEqual(Number.NEGATIVE_INFINITY)
        })

        it("Maintains the sign when dividing by Object(-0)", function(){
            var result = babelFunctions.f__divide(5, Object(-0))
            expect(result).toEqual(Number.NEGATIVE_INFINITY)
        })
    })

    describe("f__doubleEqual", function(){
        it("Can compare a string to an object that returns a traced value from toString", function(){
            var obj = {
                toString: function(){
                    return makeTraceObject({
                        value: "Cake",
                        origin: {}
                    })
                }
            }

            expect(babelFunctions.f__doubleEqual(obj, "Cake")).toBe(true)
        })

        it("Knows that String('a') and 'a' are equal", function(){
            var a = nativeStringObject("a")
            var res = babelFunctions.f__doubleEqual(a, "a")
            expect(res).toBe(true)
        })
    })

    describe("f__assign", function(){
        it("Allows assigning to a null key", function(){
            var obj = {}
            babelFunctions.f__assign(obj, null, 123)

            expect(obj["null"]).toBe(123)
        })
        it("Stores numeric keys as strings", function(){
            var obj = {};
            babelFunctions.f__assign(obj, 0, "sth")

            var trackedName = f__getTrackedPropertyName(obj, 0)
            expect(trackedName).toBe("0")
        })
        it("Doesn't convert Symbols to strings", function(){
            var obj = {};
            var key = Symbol()
            babelFunctions.f__assign(obj, key, "value")

            expect(obj["Symbol()"]).toBe(undefined)
        })
        it("Doesn't convert Object(Symbols) to strings", function(){
            var obj = {};
            var key = Object(Symbol())
            babelFunctions.f__assign(obj, key, "value")

            expect(obj["Symbol()"]).toBe(undefined)
        })
        it("Can always attempt to overwrite Promise.prototype", function(){
            "use strict" // In strict mode overwriting Promise.prototype is normally illegal, but FromJS
            // is always in strict mode, so the assignment might actually be valid in the non-strict code
            // that has been instrumented with f__assign
            var hadError = false
            try {
                babelFunctions.f__assign(Promise, "prototype", {})
            } catch (err) {
                hadError = true
            }
            expect(hadError).toBe(false)
        })
    })
})

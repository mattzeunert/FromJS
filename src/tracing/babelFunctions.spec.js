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
        it("Knows that String('a') and 'a' are equal", function(){
            var a = nativeStringObject("a")
            var res = babelFunctions.f__tripleEqual(a, "a")
            expect(res).toBe(true)
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
    })

    describe("f__getReadyState, f__setDocumentReadyState", function(){
        it("returns the assigned ready state if reading readyState from document object", function(){
            babelFunctions.f__setDocumentReadyState("done")
            var readyState = babelFunctions.f__getReadyState(window.document)
            expect(readyState).toBe("done")
        })
        it("returns the readyState property value when reading from normal object", function(){
            babelFunctions.f__setDocumentReadyState("done")
            var obj = {readyState: 123}
            var readyState = babelFunctions.f__getReadyState(obj)
            expect(readyState).toBe(123)
        })
    })
})

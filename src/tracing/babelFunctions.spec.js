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
    })

    describe("f__subtract", function(){
        it("Supports subtracting undfined from a number", function(){
            var result = babelFunctions.f__subtract(5,  undefined)
            expect(isNaN(result)).toBe(true)
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
    })

    describe("f__assign", function(){
        it("Allows assigning to a null key", function(){
            var obj = {}
            babelFunctions.f__assign(obj, null, 123)

            expect(obj["null"]).toBe(123)
        })
    })
})

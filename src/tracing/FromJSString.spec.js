import {makeTraceObject} from "./FromJSString"

function makeString(str){
    return makeTraceObject({
        value: str,
        origin: {
            isFromJSOriginObject: true,
            value: str
        }
    })
}

describe("FromJSString", function(){
    it("Accepts undefined parameters", function(){
        var str = makeTraceObject({
            value: "Hi",
            origin: {}
        })
        var index = str.indexOf(undefined)
        expect(index).toBe(-1)
    })
    it("Should not have any enumerable properties that could leak in a for...in loop", function(){
        var str = makeTraceObject({
            value: "Hi",
            origin: {}
        })

        var keys = []
        for (var key in str){
            keys.push(key);
        }
        expect(keys).toEqual([])
    })
    it("Lets you access character at a specific index", function(){
        var str = makeTraceObject({
            value: "Hello",
            origin: {}
        })

        var char = str[0]
        expect(char).toBe("H")
    })

    it("Supports substr calls", function(){
        var str = makeTraceObject({
            value: "Hello",
            origin: {}
        })

        str = str.substr(1)
        expect(str.value).toBe("ello")
        expect(str.origin.action).toBe("Substr Call")
    })

    it("Shows the native string object as the traced string constructor", function(){
        var str = makeTraceObject({
            value: "Hello",
            origin: {}
        })

        expect(str.constructor).toBe(window.String)
    })

    it("Throws an error when trying to use in operator on string", function(){
        var str = makeTraceObject({
            value: "Hello",
            origin: {}
        })

        expect(function(){
            "sth" in str
        }).toThrow()
    })

    describe("split", function(){
        it("Falls back to native split if a limit is passed in", function(){
            var str = makeString("a-b-c")
            expect(str.split("-", 2).map(s => s.value)).toEqual(["a", "b"])
        })
        it("Works with a string literal", function(){
            var str = makeString("a-b-c")
            debugger
            var res = str.split("-")
            expect(res.map(s => s.value)).toEqual(["a", "b", "c"])
            expect(res[0].origin.action).toBe("Split Call")
            expect(res[0].origin.inputValues[0]).toBe(str.origin)
            expect(res[0].origin.inputValuesCharacterIndex[0]).toBe(0)
            expect(res[0].origin.inputValues[1].value).toBe("-")
            expect(res[1].origin.inputValuesCharacterIndex[0]).toBe(2)
        })
        it("Works with a regular expression", function(){
            var str = makeString("a--b-c")
            var res = str.split(/[-]+/)
            expect(res.map(s => s.value)).toEqual(["a", "b", "c"])
            expect(res[0].origin.action).toBe("Split Call")
            expect(res[0].origin.inputValues[0]).toBe(str.origin)
            expect(res[0].origin.inputValues[1].value).toBe("/[-]+/")
            expect(res[1].origin.inputValuesCharacterIndex[0]).toBe(3)
        })
    })

    describe("replace", function(){
        it("Supports basic replace calls", function(){
            var str = makeTraceObject({
                value: "Hello World!",
                origin: {}
            })

            str = str.replace("Hello", "Hi");
            expect(str.value).toBe("Hi World!");
        })

        it("Supports using a number as a replacement", function(){
            var str = makeTraceObject({
                value: "Hi!",
                origin: {}
            })

            str = str.replace("!", 10)
            expect(str.value).toBe("Hi10")
        })

        it("Supports submatch replacements with $n", function(){
            var str = makeTraceObject({
                value: "Hello!",
                origin: {}
            })

            str = str.replace(/(!)/, "$1$1");
            expect(str.value).toBe("Hello!!")
        })

        it("Supports submatch replacements with $&", function(){
            var str = makeTraceObject({
                value: "Hi",
                origin: {}
            })

            str = str.replace(/(i)/, "$&!")
            expect(str.value).toBe("Hi!")
        });

        it("Keeps the $n string if the submatch doesn't exist in the regex", function(){
            var str = makeTraceObject({
                value: "Hello",
                origin: {}
            })

            str = str.replace(/H/, "$1")
            expect(str.value).toBe("$1ello")
        })

        it("Replaces an unmatched submatch with an empty string", function(){
            var str = makeTraceObject({
                value: "Hello",
                origin: {}
            })

            str = str.replace(/(X)?/, "$1")
            expect(str.value).toBe("Hello")
        })

        it("Supports a replacement function that returns a string", function(){
            var str = makeTraceObject({
                value: "123",
                origin: {}
            })

            str = str.replace(/(\d)/g, function(val){
                return parseFloat(val) + 1;
            })
            expect(str.value).toBe("234")
        })

        it("Supports a replacement function that returns undefined", function(){
            var str = makeTraceObject({
                value: "sth",
                origin: {}
            })

            str = str.replace(/s/, function(val){
                return undefined
            })
            expect(str.value).toBe("undefinedth")
        })
    })
})

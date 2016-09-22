import {makeTraceObject} from "./FromJSString"

describe("FromJSString", function(){
    it("Accepts undefined parameters", function(){
        var str = makeTraceObject({
            value: "Hi",
            origin: {}
        })
        var index = str.indexOf(undefined)
        expect(index).toBe(-1)
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
    })
})

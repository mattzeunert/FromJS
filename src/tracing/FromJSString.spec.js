import {makeTraceObject} from "./FromJSString"

describe("FromJSString.replace", function(){
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

    it("Lets you access character at a specific index", function(){
        var str = makeTraceObject({
            value: "Hello",
            origin: {}
        })

        var char = str[0]
        expect(char).toBe("H")
    })
})

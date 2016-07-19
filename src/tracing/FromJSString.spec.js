import FromJSString from "./FromJSString"

describe("FromJSString.replace", function(){
    it("Supports basic replace calls", function(){
        var str = new FromJSString({
            value: "Hello World!",
            origin: {}
        })

        str = str.replace("Hello", "Hi");
        expect(str.value).toBe("Hi World!");
    })

    it("Supports using a number as a replacement", function(){
        var str = new FromJSString({
            value: "Hi!",
            origin: {}
        })

        str = str.replace("!", 10)
        expect(str.value).toBe("Hi10")
    })

    it("Supports submatch replacements with $n", function(){
        var str = new FromJSString({
            value: "Hello!",
            origin: {}
        })

        str = str.replace(/(!)/, "$1$1");
        expect(str.value).toBe("Hello!!")
    })
})

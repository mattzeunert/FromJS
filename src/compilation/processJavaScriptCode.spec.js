import processJavaScriptCode from "./processJavaScriptCode"

describe("processJavaScriptCode", function(){
    it("Wraps string literals with an object with an origin", function(){
        var code = "var a = 'Hello';a"
        code = processJavaScriptCode(code).code
        expect(eval(code).origin.action).toBe("String Literal")
    })

    it("Doesn't break conditional operator when used with a tracked string", function(){
        var code = "'' ? true : false"
        code = processJavaScriptCode(code).code
        expect(eval(code)).toBe(false)
    })

    it("Doesn't break if statements when used with a tracked string", function(){
        var code = `
            var a = false
            if ("") {
                a = true
            };
            a
        `
        code = processJavaScriptCode(code).code
        expect(eval(code)).toBe(false)
    })

    it("Doesn't break normal OR expressions", function(){
        var code = "var a = {} || false;a"
        code = processJavaScriptCode(code).code
        expect(eval(code)).toEqual({})
    })

    it("Returns the correct value from OR expressions on tracked strings", function(){
        var code = "'' || 'hi'"
        code = processJavaScriptCode(code).code
        expect(eval(code).value).toBe("hi")
    })

    // same for &&
})

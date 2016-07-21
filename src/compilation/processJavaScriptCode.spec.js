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

    it("Returns the correct value from AND expressions on tracked strings", function(){
        var code = "'hi' && ''"
        code = processJavaScriptCode(code).code
        expect(eval(code).value).toBe("")
    })

    it("Doesn't try to evaluate the second part of an AND expression if the first part is falsy", function(){
        var code = "var obj = undefined;obj && obj.hi"
        code = processJavaScriptCode(code).code
        console.log(code)
        expect(eval(code)).toBe(undefined)
    })

    it("Converts value to boolean when using NOT operator", function(){
        var code = "!''"
        code = processJavaScriptCode(code).code
        expect(eval(code)).toBe(true)

        code = "!!''"
        code = processJavaScriptCode(code).code
        expect(eval(code)).toBe(false)
    })
})

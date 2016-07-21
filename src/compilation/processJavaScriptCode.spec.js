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
})

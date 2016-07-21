import processJavaScriptCode from "./processJavaScriptCode"

describe("processJavaScriptCode", function(){
    it("Wraps string literals with an object with an origin", function(){
        var code = "var a = 'Hello';a"
        code = processJavaScriptCode(code).code
        expect(eval(code).origin.action).toBe("String Literal")
    })
})

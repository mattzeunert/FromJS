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

    it("Works correctly when nesting AND and OR expressions", function(){
        // I used to have suspicions that the cached value could break something like this,
        // but it seems to work.
        var code = "(1 && 2) || 3"

        code = processJavaScriptCode(code).code
        expect(eval(code)).toBe(2)
    })

    it("f__assign returns the assigned value", function(){
        var obj = {};
        var res = f__assign(obj, "prop", "value")
        expect(res).toBe("value")
    })

    it("Gives access to the tracked property names in a for...in loop", function(){
        var code = `
            var obj = {"hi": "there"};
            var key;
            for (key in obj){};
            key;
        `
        code = processJavaScriptCode(code).code;
        var evalRes = eval(code)
        expect(evalRes.value).toBe("hi")
        expect(evalRes.origin.action).toBe("String Literal")
    });

    it("For...in loops work without a block statement body", function(){
        var code = `
            var obj = {"hi": "there"};
            var key;
            for (key in obj) false ? "cake": "cookie";
            key;
        `
        code = processJavaScriptCode(code).code;
        var evalRes = eval(code)
        expect(evalRes.value).toBe("hi")
        expect(evalRes.origin.action).toBe("String Literal")
    });

    it("For...in loops work when accessing a property name from a member expression", function(){
        var code = `
            var obj = {
                sth: {"hi": "there"}
            }
            var key;
            for (key in obj.sth) if (false) {};
            key;
        `
        code = processJavaScriptCode(code).code;
        var evalRes = eval(code)
        expect(evalRes.value).toBe("hi")
        expect(evalRes.origin.action).toBe("String Literal")
    });

    it("Can handle nested conditional operators", function(){
         var code = "var a = true ? ('' ? null : ({} ? 'yes' : null)) : null;a"
        code = processJavaScriptCode(code).code
        expect(eval(code).value).toBe("yes")
    })
})

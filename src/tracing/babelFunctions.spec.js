import babelFunctions from "./babelFunctions"

describe("babelFunctions", function(){
    describe("f__add", function(){
        it("Supports adding a string to an object", function(){
            var obj = {
                toString: () => "obj"
            }
            var res = babelFunctions.f__add(obj, "sth")
            expect(res.value).toBe("objsth")
        })
    })
})

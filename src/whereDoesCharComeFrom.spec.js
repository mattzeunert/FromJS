import whereDoesCharComeFrom from "./whereDoesCharComeFrom"
import _ from "underscore"

describe("whereDoesCharComeFrom", function(){
    it("Can traverse string concatenations", function(done){
        var origin = {
            value: "Hello World!",
            action: "Concat",
            inputValues: [{
                action: "String Literal",
                inputValues: [],
                value: "Hello "
            }, {
                action: "String Literal",
                inputValues: [],
                value: "World!"
            }],
        }

        whereDoesCharComeFrom(origin, 0, function(steps){
            expect(_.last(steps).originObject.value).toBe("Hello ")
            whereDoesCharComeFrom(origin, 6, function(steps){
                expect(_.last(steps).originObject.value).toBe("World!")
                done()
            })
        })
    })
})

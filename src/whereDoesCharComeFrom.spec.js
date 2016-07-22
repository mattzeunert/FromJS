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

    it("Can traverse array joins", function(done){
        var origin = {
            action: "Array Join Call",
            value: "a-b",
            inputValues: [{
                action: "String Literal",
                inputValues: [],
                value: "-"
            },{
                action: "String Literal",
                inputValues: [],
                value: "a"
            },{
                action: "String Literal",
                inputValues: [],
                value: "b"
            }]
        }

        whereDoesCharComeFrom(origin, 0, function(steps){
            expect(_.last(steps).originObject.value).toBe("a")
            whereDoesCharComeFrom(origin, 1, function(steps){
                expect(_.last(steps).originObject.value).toBe("-")
                whereDoesCharComeFrom(origin, 2, function(steps){
                    expect(_.last(steps).originObject.value).toBe("b")
                    done();
                })
            })
        })
    })
})

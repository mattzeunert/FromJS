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

    it("Can traverse setAttribute calls", function(){
        var origin = {
            action: "setAttribute",
            value: " color='red'",
            inputValues: [
                {
                    action: "String Literal",
                    value: "color",
                    inputValues: []
                },
                {
                    action: "String Literal",
                    value: "red",
                    inputValues: []
                }
            ]
        }

        // [c]olor='red'
        whereDoesCharComeFrom(origin, 1, function(steps){
            var lastStep = _.last(steps)
            expect(lastStep.characterIndex).toBe(0)
            expect(lastStep.originObject.value).toBe("color")
        })

        // color='r[e]d'
        whereDoesCharComeFrom(origin, 9, function(steps){
            var lastStep = _.last(steps)
            expect(lastStep.characterIndex).toBe(1)
            expect(lastStep.originObject.value).toBe("red")
        })
    })

    it("Can traverse style.setProperty calls", function(){
        var origin = {
            action: "Style SetProperty",
            value: " style='color: red'",
            inputValues: [
                {
                    value: "color",
                    inputValues: [],
                    action: "String Literal"
                },
                {
                    value: "red",
                    inputValues: [],
                    action: "String Literal"
                }
            ]
        }

        // style='col[o]r: red'
        whereDoesCharComeFrom(origin, 11, function(steps){
            var lastStep = steps[steps.length - 1]
            expect(lastStep.originObject.action).toBe("String Literal")
            expect(lastStep.originObject.value[lastStep.characterIndex]).toBe("o")
        })

        // style='color: [r]ed'
        whereDoesCharComeFrom(origin, 15, function(steps){
            var lastStep = steps[steps.length - 1]
            expect(lastStep.originObject.action).toBe("String Literal")
            expect(lastStep.originObject.value[lastStep.characterIndex]).toBe("r")
        })
    })

    it("Can traverse toLowerCase calls", function(){
        var origin = {
            action: "ToLowerCase Call",
            value: "abc",
            inputValues: [
                {
                    value: "AbC",
                    inputValues: [],
                    action: "String Literal"
                }
            ]
        }

        whereDoesCharComeFrom(origin, 1, function(steps){
            var lastStep = steps[steps.length - 1]
            expect(lastStep.originObject.action).toBe("String Literal")
        })
    })

    it("Can traverse toUpperCase calls", function(){
        var origin = {
            action: "ToUpperCase Call",
            value: "ABC",
            inputValues: [
                {
                    value: "abC",
                    inputValues: [],
                    action: "String Literal"
                }
            ]
        }

        whereDoesCharComeFrom(origin, 1, function(steps){
            var lastStep = steps[steps.length - 1]
            expect(lastStep.originObject.action).toBe("String Literal")
        })
    })
})

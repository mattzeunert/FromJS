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

        whereDoesCharComeFrom([origin, 0], function(steps){
            expect(_.last(steps).origin.value).toBe("Hello ")
            whereDoesCharComeFrom([origin, 6], function(steps){
                expect(_.last(steps).origin.value).toBe("World!")
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

        whereDoesCharComeFrom([origin, 0], function(steps){
            expect(_.last(steps).origin.value).toBe("a")
            whereDoesCharComeFrom([origin, 1], function(steps){
                expect(_.last(steps).origin.value).toBe("-")
                whereDoesCharComeFrom([origin, 2], function(steps){
                    expect(_.last(steps).origin.value).toBe("b")
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
        whereDoesCharComeFrom([origin, 1], function(steps){
            var lastStep = _.last(steps)
            expect(lastStep.characterIndex).toBe(0)
            expect(lastStep.origin.value).toBe("color")
        })

        // color='r[e]d'
        whereDoesCharComeFrom([origin, 9], function(steps){
            var lastStep = _.last(steps)
            expect(lastStep.characterIndex).toBe(1)
            expect(lastStep.origin.value).toBe("red")
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
        whereDoesCharComeFrom([origin, 11], function(steps){
            var lastStep = steps[steps.length - 1]
            expect(lastStep.origin.action).toBe("String Literal")
            expect(lastStep.origin.value[lastStep.characterIndex]).toBe("o")
        })

        // style='color: [r]ed'
        whereDoesCharComeFrom([origin, 15], function(steps){
            var lastStep = steps[steps.length - 1]
            expect(lastStep.origin.action).toBe("String Literal")
            expect(lastStep.origin.value[lastStep.characterIndex]).toBe("r")
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

        whereDoesCharComeFrom([origin, 1], function(steps){
            var lastStep = steps[steps.length - 1]
            expect(lastStep.origin.action).toBe("String Literal")
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

        whereDoesCharComeFrom([origin, 1], function(steps){
            var lastStep = steps[steps.length - 1]
            expect(lastStep.origin.action).toBe("String Literal")
        })
    })

    it("Can traverse JSON.stringify calls", function(){
        var origin = {
            action: "JSON.stringify",
            value: '"Hello"',
            inputValues: [
                {
                    value: "Hello",
                    action: "String Literal",
                    inputValues: []
                }
            ]
        }

        whereDoesCharComeFrom([origin, 2], function(steps){
            var lastStep = steps[steps.length - 1]
            expect(lastStep.origin.action).toBe("String Literal")
            expect(lastStep.characterIndex).toBe(1)
        })
    })

    it("Can traverse String Split Calls", function(){
        var origin = {
            action: "Split Call",
            value: "cd",
            inputValues: [
                {
                    value: "ab-cd-ef",
                    action: "String Literal",
                    inputValues: []
                },
                {
                    value: "-",
                    action: "String Literal",
                    inputValues: []
                }
            ],
            inputValuesCharacterIndex: [3]
        }

        whereDoesCharComeFrom([origin, 1], function(steps){
            var lastStep = steps[steps.length - 1]
            expect(lastStep.origin.action).toBe("String Literal")
            expect(lastStep.characterIndex).toBe(4)
        })
    })
})

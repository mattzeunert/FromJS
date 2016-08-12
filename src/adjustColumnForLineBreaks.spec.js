import adjustColumnForLineBreaks from "./adjustColumnForLineBreaks"

describe("adjustColumnForLineBreaks", function(){
    it("Knows that a new line character in a string is represented by two line characters in code", function(){
        var code = "Hello\\nworld!"
        var str = "Hello\nworld!"
        var wIndex = str.indexOf("w")
        var adjustedIndex = adjustColumnForLineBreaks(code, wIndex)
        expect(code[adjustedIndex]).toBe("w")
    })
})
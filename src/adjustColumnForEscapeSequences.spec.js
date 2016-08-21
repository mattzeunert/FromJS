import adjustColumnForEscapeSequences from "./adjustColumnForEscapeSequences"

describe("adjustColumnForEscapeSequences", function(){
    it("Knows that a new line character in a string is represented by two characters (\n) in code", function(){
        var code = "Hello\\nworld!"
        var str = "Hello\nworld!"
        var wIndex = str.indexOf("w")
        var adjustedIndex = adjustColumnForEscapeSequences(code, wIndex)
        expect(code[adjustedIndex]).toBe("w")
    })
    it("Knows that a tab character in a string is represented by two characters (\t) in code", function(){
        var code = "Hello\\tworld!"
        var str = "Hello\tworld!"
        var wIndex = str.indexOf("w")
        var adjustedIndex = adjustColumnForEscapeSequences(code, wIndex)
        expect(code[adjustedIndex]).toBe("w")
    })
})
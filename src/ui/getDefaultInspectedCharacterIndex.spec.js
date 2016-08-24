import getDefaultInspectedCharacterIndex from "./getDefaultInspectedCharacterIndex"

describe("getDefaultInspectedCharacterIndex", function(){
    it("Looks for the first bit of content in the HTML", function(){
        var html = "<a>\n Hi</a>"
        var index = getDefaultInspectedCharacterIndex(html)
        expect(index).toBe(html.indexOf("H"))
    })
    it("Selects the first tag name character if a tag has no closing tag", function(){
        var html = "<input>"
        var index = getDefaultInspectedCharacterIndex(html)
        expect(index).toBe(html.indexOf("i"))
    })
})

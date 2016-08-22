import normalizeHtml, {normalizeHtmlAttribute} from "./normalizeHtml"

describe("normalizeHtml", function(){
    it("Converts & to &amp'", function(){
        expect(normalizeHtml("&")).toBe("&amp;")
    })
    it("Converts &raquo; to »", function(){
        expect(normalizeHtml("&raquo;")).toBe("»")
    })
})

describe("normalizeHtmlAttribute", function(){
    it("Converts & to &amp'", function(){
        expect(normalizeHtmlAttribute("&")).toBe("&amp;")
    })
    it("Converts &raquo; to &amp;raquo;", function(){
        expect(normalizeHtmlAttribute("&raquo;")).toBe("&amp;raquo;")
    })
    it("Converts quote signs to &quot", function(){
        expect(normalizeHtmlAttribute('\"')).toBe("&quot;")
    })
})
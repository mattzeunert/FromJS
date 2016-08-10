import {enableTracing, disableTracing} from "./tracing/tracing"
import getRootOriginAtChar from "./getRootOriginAtChar"
import whereDoesCharComeFrom from "./whereDoesCharComeFrom"

import {disableProcessHTMLOnInitialLoad} from "./tracing/processElementsAvailableOnInitialLoad"
disableProcessHTMLOnInitialLoad()

describe("HTML Mapping", function(){
    beforeEach(function(){
        enableTracing()
    })
    afterEach(function(){
        disableTracing()
    })

    it("Traces a basic string assignment", function(){
        var el = document.createElement("div")
        el.innerHTML = "Hello"

        // <[d]iv>Hello</div>
        expect(getRootOriginAtChar(el, 1).origin.action).toBe("createElement")

        // <div>[H]ello</div>
        var originAndChar = getRootOriginAtChar(el, 5);
        expect(originAndChar.origin.action).toBe("Assign InnerHTML")
        expect(originAndChar.origin.value[originAndChar.characterIndex]).toBe("H")
    })

    it("Traces nested HTML assignments", function(){
        var el = document.createElement("div")
        el.innerHTML = 'Hello <b>World</b>!'
        var bTag = el.children[0]

        // <b>[W]orld</b>
        var originAndChar = getRootOriginAtChar(bTag, 3);
        expect(originAndChar.origin.action).toBe("Assign InnerHTML")
        expect(originAndChar.origin.value[originAndChar.characterIndex]).toBe("W")
    })

    it("Traces attributes without a value correctly", function(done){
        var el = document.createElement("div")
        el.innerHTML = '<span hello world>Hi</span>'
        var span = el.children[0]

        disableTracing()
        // just to clarify what's going on, Chrome is adding the "" to the attribute
        expect(el.innerHTML).toBe('<span hello="" world="">Hi</span>')

        // <span hello="" world="">[H]i</span>
        var originAndChar = getRootOriginAtChar(span, 24);
        expect(originAndChar.origin.action).toBe("Assign InnerHTML")
        expect(originAndChar.origin.value[originAndChar.characterIndex]).toBe("H")

        whereDoesCharComeFrom(originAndChar.origin, originAndChar.characterIndex, function(steps){
            var value = steps[1].originObject.value;
            var characterIndex = steps[1].characterIndex
            // correctly traces back to assigned string
            expect(value).toBe("<span hello world>Hi</span>")
            expect(value[characterIndex]).toBe("H")
            done()
        })
    })

    it("Traces attributes with an empty value correctly", function(done){
        var el = document.createElement("div")
        el.innerHTML = '<span hello="">Hi</span>'
        var span = el.children[0]

        disableTracing()

        // <span hello="">[H]i</span>
        var originAndChar = getRootOriginAtChar(span, 15);
        whereDoesCharComeFrom(originAndChar.origin, originAndChar.characterIndex, function(steps){
            var value = steps[1].originObject.value;
            var characterIndex = steps[1].characterIndex
            // correctly traces back to assigned string
            expect(value).toBe("<span hello=\"\">Hi</span>")
            expect(value[characterIndex]).toBe("H")
            done()
        })
    })

    it("Traces an extra space at the end of a tag correctly", function(done){
        var el = document.createElement("div")
        el.innerHTML = '<span >Hi</span>'
        var span = el.children[0]

        disableTracing()
        expect(el.innerHTML).toBe('<span>Hi</span>')

        // <span>[H]i</span>
        var originAndChar = getRootOriginAtChar(span, 6);

        whereDoesCharComeFrom(originAndChar.origin, originAndChar.characterIndex, function(steps){
            var value = steps[1].originObject.value;
            var characterIndex = steps[1].characterIndex
            expect(value).toBe("<span >Hi</span>")
            expect(value[characterIndex]).toBe("H")
            done()
        })
    })

    it("Traces unescaped HTML entities correctly", function(done){
        var el = document.createElement("div")
        el.innerHTML = '&'

        disableTracing()
        expect(el.innerHTML).toBe('&amp;')

        // <div>&a[m]p;</div>
        var originAndChar = getRootOriginAtChar(el, 7);

        whereDoesCharComeFrom(originAndChar.origin, originAndChar.characterIndex, function(steps){
            var value = steps[1].originObject.value;
            var characterIndex = steps[1].characterIndex
            expect(value).toBe("&")
            expect(characterIndex).toBe(0)
            done()
        })
    })
})

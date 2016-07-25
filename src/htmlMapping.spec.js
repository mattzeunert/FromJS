import {enableTracing, disableTracing} from "./tracing/tracing"
import getRootOriginAtChar from "./getRootOriginAtChar"

import {disableProcessHTMLOnInitialLoad} from "./tracing/processElementsAvailableOnInitialLoad"
disableProcessHTMLOnInitialLoad()

fdescribe("HTML Mapping", function(){
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

    
})

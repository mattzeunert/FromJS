import CodePreprocessor from "./index"

describe("ChromeCodeInstrumenter", function(){
    describe("f__getReadyState, f__setDocumentReadyState", function(){
        it("returns the assigned ready state if reading readyState from document object", function(){
            var processor = new CodePreprocessor({})
            window.f__setDocumentReadyState("done")

            var readyState = window.f__getReadyState(window.document)
            expect(readyState).toBe("done")
        })
        it("returns the readyState property value when reading from normal object", function(){
            var processor = new CodePreprocessor({})
            window.f__setDocumentReadyState("done")

            var obj = {readyState: 123}
            var readyState = window.f__getReadyState(obj)
            expect(readyState).toBe(123)
        })
    })

    describe("appendChild", function(){
        it("Returns the appended child when called", function(){
            var processor = new CodePreprocessor({})
            processor.enable()
            var parent = document.createElement("div")
            var child = document.createElement("span")

            var childReturned = parent.appendChild(child)

            expect(childReturned).toBe(child)
            processor.disable();
        })
    })
})

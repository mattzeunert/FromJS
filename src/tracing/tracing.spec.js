import {enableTracing, disableTracing} from "./tracing"
import {makeTraceObject} from "./FromJSString"
import {disableProcessHTMLOnInitialLoad} from "./processElementsAvailableOnInitialLoad"

describe("Tracing", function(){
    beforeEach(function(){
        disableProcessHTMLOnInitialLoad()
        enableTracing();
    })
    afterEach(function(){
        disableTracing()
    })

    it("Tracks data read using localStorage.getItem", function(){
        localStorage.setItem("test", "hello")
        var value = localStorage.getItem("test")
        expect(value.origin).not.toBe(undefined);
    });

    it("Tracks data read using localStorage[key]", function(){
        localStorage.setItem("test", "hello")
        var value = localStorage["test"]
        expect(value.origin).not.toBe(undefined);
    });

    it("JSON.parse can parse flat JSON objects", function(){
        var parsed = JSON.parse('{"hello": "world"}')
        expect(parsed.hello.value).toBe("world")
    })

    it("JSON.parse can handle arrays in JSON objects", function(){
        var parsed = JSON.parse('{"hello": ["one", "two"]}')
        expect(parsed.hello.length).toBe(2)
        expect(parsed.hello[0].value).toBe("one")
    })

    it("JSON.parse can handle nested objects", function(){
        var parsed = JSON.parse('{"hello": {"there": "world"}}')
        expect(parsed.hello.there.value).toBe("world")
    })

    it("Processes code passed into new Function", function(){
        // not very clean at all, should have a think at some point
        // how to make it cleaner without global vars
        var dynamicFileCountBefore = Object.keys(window.fromJSDynamicFiles).length
        var fn = new Function("return 'hi'")
        expect(fn().value).toBe("hi")
        var dynamicFileCountAfter = Object.keys(window.fromJSDynamicFiles).length
        // 3 because we have the original code, compiled code, and source map
        expect(dynamicFileCountAfter - dynamicFileCountBefore).toBe(3)
    })

    it("Processes code passed into eval", function(){
        spyOn(window, "f__StringLiteral")
        var dynamicFileCountBefore = Object.keys(window.fromJSDynamicFiles).length
        eval("a = 'Hello'")
        expect(window.f__StringLiteral).toHaveBeenCalled()
        var dynamicFileCountAfter = Object.keys(window.fromJSDynamicFiles).length
        // 3 because we have the original code, compiled code, and source map
        expect(dynamicFileCountAfter - dynamicFileCountBefore).toBe(3)
    })

    it("Processes code when it's added to a script tag with textContent", function(){
        spyOn(window, "f__StringLiteral")
        var dynamicFileCountBefore = Object.keys(window.fromJSDynamicFiles).length

        var el = document.createElement("script")
        // It's an imperfect solution, but it sorta works for now
        // Would be bad if the inspected app would try to read the
        // textContent later for example
        el.textContent = "a = 'Hello'"
        document.body.appendChild(el)
        expect(window.f__StringLiteral).toHaveBeenCalled()
        var dynamicFileCountAfter = Object.keys(window.fromJSDynamicFiles).length
        expect(dynamicFileCountAfter - dynamicFileCountBefore).toBe(3)
    })

    it("Array.join works with objects that have a custom toString function which returns a tracked string", function(){
        var obj = {
            toString: function(){
                return makeTraceObject({
                    value: "Hello",
                    origin: {}
                })
            }
        }

        var joined = [obj, obj].join("-")
        expect(joined.value).toBe("Hello-Hello")
    })

    it("Array.indexOf works with tracked strings", function(){
        var str = makeTraceObject({
            value: "Hello",
            origin: {}
        })
        var arr = [str]

        expect(arr.indexOf("Hello")).toBe(0)
        expect(arr.indexOf("Hi")).toBe(-1)
    })
})

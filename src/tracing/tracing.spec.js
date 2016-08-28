import {enableTracing, disableTracing} from "./tracing"
import {makeTraceObject} from "./FromJSString"

describe("Tracing", function(){
    beforeEach(function(){
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
        var parsed = JSON.parse({
            value: '{"hello": "world"}',
            origin: {
                action: "Some Action"
            },
            toString: function(){
                return this.value
            }
        })
        expect(parsed.hello.value).toBe("world")
        expect(parsed.hello.origin.action).toBe("JSON.parse")
        expect(parsed.hello.origin.inputValues[0].action).toBe("Some Action")
    })

    it("JSON.parse can handle arrays in JSON objects", function(){
        var parsed = JSON.parse({
            toString: () => '{"hello": ["one", "two"]}',
            origin: {}
        })
        expect(parsed.hello.length).toBe(2)
        expect(parsed.hello[0].value).toBe("one")
    })

    it("JSON.parse can handle nested objects", function(){
        var parsed = JSON.parse({
            toString(){
                return '{"hello": {"there": "world"}}'
            },
            origin: {
                action: "Some Action"
            }
        })
        expect(parsed.hello.there.value).toBe("world")
        expect(parsed.hello.there.origin.inputValues[0].action).toBe("Some Action")
        // {"hello": {"there": "[w]orld"}}
        expect(parsed.hello.there.origin.inputValuesCharacterIndex[0]).toBe(21)
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

    it("Processes code when it's added to a script tag with .textContent", function(){
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

    it("Processes code when it's added to a script tag with .text", function(){
        spyOn(window, "f__StringLiteral")
        var dynamicFileCountBefore = Object.keys(window.fromJSDynamicFiles).length

        var el = document.createElement("script")
        el.text = "a = 'Hello'"
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

    it("appendChild supports appending document fragments", function(){
        var el = document.createElement("div")
        var frag = document.createDocumentFragment();
        var child = document.createElement("span")

        frag.appendChild(child);
        el.appendChild(frag)

        expect(el.__elOrigin.contents[0]).not.toBe(frag)
        expect(el.__elOrigin.contents[0]).toBe(child)
    })

    it("appendChild supports appending document fragments with multiple children", function(){
        var el = document.createElement("div")
        var frag = document.createDocumentFragment();
        var child = document.createElement("span")
        var child2 = document.createElement("p")

        frag.appendChild(child);
        frag.appendChild(child2)
        el.appendChild(frag)

        expect(el.__elOrigin.contents[0]).toBe(child)
        expect(el.__elOrigin.contents[1]).toBe(child2)
    })

    it("Traces newly created text nodes", function(){
        var node = document.createTextNode("hi")
        expect(node.__elOrigin.textValue.action).toBe("createTextNode")
    })

    it("Maintains __elOrigin properties when calling .cloneNode", function(){
        var el = document.createElement("div")
        el.__elOrigin = "test"
        var clone = el.cloneNode();
        expect(clone.__elOrigin).toBe("test")
    })

    fit("Partially Supports RegExp.exec matches", function(){
        var str = "abcd"
        var re = /c/g
        var match = re.exec(str);

        expect(match[0].value).toBe("c")
        expect(match[0].origin.action).toBe("RegExp.exec Match")
        expect(match[0].origin.inputValuesCharacterIndex[0]).toBe(2)
    })

    it("Maintains __elOrigin properties when calling .cloneNode with deep being set to true", function(){
        var parent = document.createElement("div")
        parent.__elOrigin = {action: "test"}
        var child = document.createElement("p")
        child.__elOrigin = {action: "cake"}
        parent.appendChild(child)

        var clone = parent.cloneNode(true)
        expect(clone.__elOrigin.action).toBe("test")
        expect(clone.children[0].__elOrigin.action).toBe("cake")

    })
})

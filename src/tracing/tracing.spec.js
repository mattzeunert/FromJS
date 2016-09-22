import {enableTracing, disableTracing} from "./tracing"
import {makeTraceObject} from "./FromJSString"
import whereDoesCharComeFrom from "../whereDoesCharComeFrom"
import Origin from "../origin"
import createResolveFrameWorker from "../createResolveFrameWorker"

describe("Tracing", function(){
    beforeEach(function(){
        enableTracing();
    })
    afterEach(function(){
        disableTracing()
    })

    it("Tracks outerHTML that is read from an element", function(){
        var el = document.createElement("div")
        var html = el.outerHTML
        expect(html.origin.action).toBe("Read Element outerHTML")
    })

    it("Tracks the opening/closing tag origins when calling createElement", function(){
        var el = document.createElement("div")
        expect(el.__elOrigin.openingTagStart).not.toBe(undefined)
    })

    it("Tracks the opening/closing tag origins when calling createElementNS", function(){
        var el = document.createElementNS("http://www.w3.org/1999/xhtml", "div")
        expect(el.__elOrigin.openingTagStart).not.toBe(undefined)
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
                action: "Some Action",
                isFromJSOriginObject: true
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
                action: "Some Action",
                isFromJSOriginObject: true
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

    it("Supports mapping of code in new Function", function(done){
        var resolveFrameWorker = createResolveFrameWorker();

        var fn = new Function(makeTraceObject({
            value: "return 'Hi'",
            origin: new Origin({
                action: "Something",
                inputValues: [],
                value: "return 'Hi'"
            })
        }))

        var ret = fn();
        disableTracing()

        resolveFrameWorker.send("registerDynamicFiles", fromJSDynamicFiles, function(){})

        whereDoesCharComeFrom(ret.origin, 0, function(steps){
            var lastStep = steps[steps.length - 1]
            expect(lastStep.originObject.action).toBe("Something")

            resolveFrameWorker.terminate();

            done();
        }, resolveFrameWorker)
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

    describe("Array.join", function(){
        it("Works with objects that have a custom toString function which returns a tracked string", function(){
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

        it("Works with arrays", function(){
            var array = [[1,2],[3,4]];
            var joined = array.join("x");
            expect(joined.value).toBe("1,2x3,4");

            // When the numbers are converted to strings that should also be traced
            expect(joined.origin.inputValues.length).toBe(3)
        })

        it("Defaults to comma when no separator is passed in", function(){
            var array = [1,2]
            var joined = array.join();

            expect(joined.value).toBe("1,2")
            expect(joined.origin.inputValues[0].action).toBe("Default Array Join Separator")
        })

        it("Works with array-like objects", function(){
            // E.g. Trello has its' own custom List object that's a fake array without a map property
            var array = {
                0: "a",
                1: "b",
                length: 2
            }

            var res = Array.prototype.join.call(array)
            expect(res.value).toBe("a,b")

        })
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

    it("Supports RegExp.exec matches and submatches", function(){
        var str = "abcd"
        var re = /(b)(c)/g
        var matches = re.exec(str);

        expect(matches[0].value).toBe("bc")
        expect(matches[0].origin.action).toBe("RegExp.exec Match")
        expect(matches[0].origin.inputValuesCharacterIndex[0]).toBe(1)

        expect(matches[1].value).toBe("b")
        expect(matches[1].origin.action).toBe("RegExp.exec Submatch")
        expect(matches[1].origin.inputValuesCharacterIndex[0]).toBe(1)

        expect(matches[2].value).toBe("c")
        expect(matches[2].origin.action).toBe("RegExp.exec Submatch")
        expect(matches[2].origin.inputValuesCharacterIndex[0]).toBe(2)
    })

    it("Supports RegExp.exec when null is passed in instead of a string", function(){
        var str = null;
        var re = /(.*)/g
        var matches = re.exec(str)

        expect(matches[0].value).toBe("null")
        expect(matches[1].value).toBe("null")
    })

    it("Supports RegExp.exec when undefined is passed in instead of a string", function(){
        var str = undefined;
        var re = /(.*)/g
        var matches = re.exec(str)

        expect(matches[0].value).toBe("undefined")
        expect(matches[1].value).toBe("undefined")
    })

    it("Supports str.match with multiple matches", function(){
        var str = makeTraceObject({
            value: "cake",
            origin: {}
        })

        var matches = str.match(/[a-e]+/g)
        console.log("res", matches)

        expect(matches[0].value).toBe("ca")
        expect(matches[1].value).toBe("e")
    })

    it("Supports str.match without any matches", function(){
        var str = makeTraceObject({
            value: "cake",
            origin: {}
        })

        var matches = str.match(/[z]+/g)

        expect(matches).toBe(null)
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

    it("Returns [object Number] when calling Obj.prototype.toString on a number", function(){
        var toString = Object.prototype.toString
        var str = toString.call(2)

        expect(str).toBe("[object Number]")
    })

    it("Returns [object Null] when calling Obj.prototype.toString on null", function(){
        var toString = Object.prototype.toString
        var str = toString.call(null)

        expect(str).toBe("[object Null]")
    })

    it("Returns [object String] when calling Obj.prototype.toString on a traced string", function(){
        var toString = Object.prototype.toString
        var tracedStr = makeTraceObject({
            value: "Cake",
            origin: {}
        })
        var str = toString.call(tracedStr)

        expect(str).toBe("[object String]")
    })

    it("Traces when a number is converted to a string", function(){
        var num = (4).toString()
        expect(num.origin.action).toBe("Number ToString")
    })

    it("Returns a string from Array.toString, so browser built-in functions can transparently work with arrays", function(){
        var arr = [1,2]
        var str = arr.toString();
        expect(typeof str).toBe("string")
    })

    it("Doesn't return tracking properties from Object.getOwnPropertyNames", function(){
        var obj = {
            cake: "hi",
            cake_trackedName: {}
        }
        var ownPropertyNames = Object.getOwnPropertyNames(obj)
        expect(ownPropertyNames).toEqual(["cake"])
    })

    describe("CSSStyleDeclaration", function(){
        it("Traces when a single style is assigned", function(){
            var div = document.createElement("div")
            var red = makeTraceObject({
                value: "red",
                origin: {
                    action: "Some Action",
                    inputValues: [],
                    value: "red",
                    isFromJSOriginObject: true
                }
            })

            div.style.setProperty("color", red)

            disableTracing();
            expect(div.getAttribute("style")).toBe("color: red")

            var origin = div.__elOrigin.attribute_style
            // style='color: red'
            whereDoesCharComeFrom(origin, 15 , function(steps){
                var lastStep = _.last(steps)
                expect(lastStep.originObject.value).toBe("red")
                expect(lastStep.originObject.action).toBe("Some Action")
            })
        })
    })

    it("Can create a string object from an object with a custom toString method", function(){
        var obj = {
            toString: function(){
                return makeTraceObject({
                    value: "Cake",
                    origin: {}
                })
            }
        }

        var str = new String(obj);

        expect(typeof str).toBe("object");
        expect(str.toString()).toBe("Cake");
    })

    it("Can create a string object from an undefined value", function(){
        var str = new String(undefined);

        expect(typeof str).toBe("object");
        expect(str.toString()).toBe("undefined");
    })

    it("Can create a string object from a null value", function(){
        var str = new String(null);

        expect(typeof str).toBe("object");
        expect(str.toString()).toBe("null");
    })
})

import {enableTracing, disableTracing} from "./tracing"
import {makeTraceObject} from "./FromJSString"
import whereDoesCharComeFrom from "../whereDoesCharComeFrom"
import Origin from "../origin"
import createResolveFrameWorker from "../createResolveFrameWorker"
import _ from "underscore"
import DynamicCodeRegistry from "../DynamicCodeRegistry"

function makeObjWithCustomToString(str){
    return {
        toString: function(){
            return makeString(str)
        }
    }
}

function makeString(str){
    return makeTraceObject({
        value: str,
        origin: {
            action: "String Literal",
            isFromJSOriginObject: true,
            value: str,
            inputValues: []
        }
    })
}

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

    it("Tracks the start and end of a comment node when it's created", function(){
        var comment = document.createComment("Hey")
        expect(comment.__elOrigin.commentStart).not.toBe(undefined)
        expect(comment.__elOrigin.commentEnd).not.toBe(undefined)
    })

    // Don't do this for now.
    // it("Tracks string method calls on untraced strings", function(){
    //     var val = "cake".replace("c", "b")
    //     expect(val.value).toBe("bake")
    //     expect(val.origin.action).toBe("Replace Call")
    // })

    describe("JSON.stringify", function(){
        it("If just a string is passed in it returns the traced string", function(){
            var json = JSON.stringify("Hello")
            expect(json.origin.action).toBe("JSON.stringify")
        })
        it("Still works normally otherwise and returns an untraced string", function(){
            var json = JSON.stringify({a: 1})
            expect(json).toBe('{"a":1}')
        })
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

    describe("JSON.parse", function(){
        it("Can parse flat JSON objects", function(){
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
        it("Can parse parse stringified strings", function(){
            var parsed = JSON.parse(makeString('"Hello"'))
            expect(parsed.value).toBe("Hello")
            expect(parsed.origin.action).toBe("JSON.parse")
        })
        it("Can be called with an untracked string", function(){
            var parsed = JSON.parse('[{"Hello": "World"}]')
            expect(parsed[0].Hello.value).toBe("World")
        })
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

    it("Supports mapping of code in new Function", function(done){
        var resolveFrameWorker = createResolveFrameWorker();
        window.dynamicCodeRegistry = new DynamicCodeRegistry();

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

        resolveFrameWorker.send("registerDynamicFiles", dynamicCodeRegistry._content, function(){})

        whereDoesCharComeFrom([ret.origin, 0], function(steps){
            var lastStep = steps[steps.length - 1]
            expect(lastStep.origin.action).toBe("Something")

            resolveFrameWorker.terminate();

            done();
        }, resolveFrameWorker)
    })

    describe("Dynamic code processing", function(){
        beforeEach(function(){
            window.dynamicCodeRegistry = {
                register: jasmine.createSpy()
            }
        })
        afterEach(function(){
            delete window.dynamicCodeRegistry;
        })
        it("new Function()", function(){
            var fn = new Function("return 'hi'")
            expect(fn().value).toBe("hi")
            // 3 because we have the original code, compiled code, and source map
            expect(window.dynamicCodeRegistry.register).toHaveBeenCalledTimes(3)
        })

        it("eval", function(){
            spyOn(window, "f__StringLiteral")
            eval("a = 'Hello'")
            expect(window.f__StringLiteral).toHaveBeenCalled()
            expect(window.dynamicCodeRegistry.register).toHaveBeenCalledTimes(3)
        })

        it("Script tag textContent", function(){
            spyOn(window, "f__StringLiteral")

            var el = document.createElement("script")
            // It's an imperfect solution, but it sorta works for now
            // Would be bad if the inspected app would try to read the
            // textContent later for example
            el.textContent = "a = 'Hello'"
            document.body.appendChild(el)
            expect(window.f__StringLiteral).toHaveBeenCalled()
            expect(window.dynamicCodeRegistry.register).toHaveBeenCalledTimes(3)
        })

        it("Script tag text", function(){
            spyOn(window, "f__StringLiteral")

            var el = document.createElement("script")
            el.text = "a = 'Hello'"
            document.body.appendChild(el)
            expect(window.f__StringLiteral).toHaveBeenCalled()
            expect(window.dynamicCodeRegistry.register).toHaveBeenCalledTimes(3)
        })

    })

    it("Doesn't break assigning textContent directly to text nodes", function(){
        var node = document.createTextNode("Hello");
        node.textContent = "Hi";

        expect(node.textContent).toBe("Hi")
    })

    it("Supports document.write", function(){
        document.write("<div>Hello</div>")

        disableTracing();
        var div = _.last(document.body.children);
        expect(div.outerHTML).toBe("<div>Hello</div>")
        expect(div.__elOrigin.openingTagStart.action).toBe("Document.Write")
    })

    describe("Array.join", function(){
        it("Works with objects that have a custom toString function which returns a tracked string", function(){
            var obj = makeObjWithCustomToString("Hello")

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

    describe("Array.indexOf", function(){
        it("Works when the list items are tracked strings", function(){
            var str = makeTraceObject({
                value: "Hello",
                origin: {}
            })
            var arr = [str]

            expect(arr.indexOf("Hello")).toBe(0)
            expect(arr.indexOf("Hi")).toBe(-1)
        })

        it("Works when looking the list items are string objects", function(){
            var arr = ["Hello"]

            expect(arr.indexOf("Hello")).toBe(0)
            expect(arr.indexOf("Hi")).toBe(-1)
        })

        it("Works when looking for a traced string", function(){
            var tracedHello = makeTraceObject({
                value: "Hello",
                origin: {}
            })
            var tracedHi = makeTraceObject({
                value: "Hi",
                origin: {}
            })
            var arr = ["Hello"]

            expect(arr.indexOf(tracedHello)).toBe(0)
            expect(arr.indexOf(tracedHi)).toBe(-1)
        })

        it("Works when looking for a string object", function(){
            var arr = ["Hello"]

            expect(arr.indexOf(String("Hello"))).toBe(0)
            expect(arr.indexOf(String("Hi"))).toBe(-1)
        })

        it("Does not treat objects as strings", function(){
            var obj = {
                toString: function(){
                    return "Hello"
                }
            }
            var arr = [obj]

            expect(arr.indexOf("Hello")).toBe(-1)
            expect(["Hello"].indexOf(obj)).toBe(-1)
        })
    })

    it("Tracks when a value is assigned to an input element", function(){
        var el = document.createElement("input");
        el.value = makeString("Hello");

        expect(el.__elOrigin.attribute_value.value).toBe(" value=\"Hello\"")
        expect(el.__elOrigin.attribute_value.action).toBe("Input Set Value")
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

    it("Traces toFixed calls on numbers", function(){
        var str = (4.27).toFixed(1);
        expect(str.value).toBe("4.3");
        expect(str.origin.action).toBe("Number ToFixed")
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
            whereDoesCharComeFrom([origin, 15] , function(steps){
                var lastStep = _.last(steps)
                expect(lastStep.origin.value).toBe("red")
                expect(lastStep.origin.action).toBe("Some Action")
            })
        })
    })

    describe("window.String", function(){
        it("Can create a string object from an object with a custom toString method", function(){
            var obj = makeObjWithCustomToString("Cake")

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

        it("Still lets the app use String.fromCharCode", function(){
            var str = String.fromCharCode(97)
            expect(str).toBe("a")
        })
    })



    it("Can handle assigning an object to innerHTML", function(){
        var obj = makeObjWithCustomToString("Cake")
        var el = document.createElement("div")

        el.innerHTML = obj;

        disableTracing();
        expect(el.innerHTML).toBe("Cake")
    })

    describe("Object.keys", function(){
        it("Returns an empty list when called on an empty tracked string", function(){
            var str = makeTraceObject({
                value: "",
                origin: {}
            })

            var keys = Object.keys(str)
            expect(keys).toEqual([])
        })

        it("Returns the character indices when called on a non empty tracked string", function(){
            var str = makeTraceObject({
                value: "abc",
                origin: {}
            })

            var keys = Object.keys(str)
            expect(keys).toEqual(["0", "1" ,"2"])
        })

        it("Filters out tracking property names", function(){
            var obj = {
                sth: "hey",
                sth_trackedName: "sth"
            }

            var keys = Object.keys(obj);
            expect(keys).toEqual(["sth"])
        })
    })

    describe("Object.getOwnPropertyNames", function(){
        it("Only returns 'length' when called on an empty string", function(){
            var str = makeTraceObject({
                value: "",
                origin: {}
            })

            var propNames = Object.getOwnPropertyNames(str)
            expect(propNames).toEqual(["length"])
        })

        it("Returns 'length' and character indices when called on a non empty string", function(){
            var str = makeTraceObject({
                value: "abc",
                origin: {}
            })

            var propNames = Object.getOwnPropertyNames(str)
            expect(propNames).toEqual(["0", "1", "2", "length"])
        })
    })

    it("Returns true for hasOwnProperty when the index is in a traced string", function(){
        var str = makeTraceObject({
            value: "Hi",
            origin: {}
        })

        expect(str.hasOwnProperty(1)).toBe(true);
        expect(str.hasOwnProperty(2)).toBe(false)
    })
})

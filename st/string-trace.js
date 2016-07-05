require("./compile")
require("./getVisData")
import Origin from "../src/origin"
var $ = require("jquery")
var ValueMap = require("../src/value-map")
var _ = require("underscore")
import processElementsAvailableOnInitialLoad from "../src/tracing/processElementsAvailableOnInitialLoad"
import StringTraceString, {makeTraceObject} from "../src/tracing/FromJSString"
import addElOrigin from "../src/tracing/addElOrigin"
import stringTraceUseValue from "../src/tracing/stringTraceUseValue"
import mapInnerHTMLAssignment from "../src/tracing/mapInnerHTMLAssignment"

console.log("in stringtrace js")

import {enableTracing, disableTracing} from "../src/tracing/tracing"

console.log("adding")
window.addEventListener("load", function(){
    console.log("processElementsAvailableOnInitialLoad")
    if (window.isSerializedDomPage){return}
    if (window.isVis){return}
    processElementsAvailableOnInitialLoad();
})






function makeOrigin(opts){
    return new Origin(opts)

}



function stringTrace(value){
    return makeTraceObject({
        value: value,
        origin: makeOrigin({
            action: "String Literal",
            value: value,
            inputValues: []
        }),
    })
};

function stringTraceTypeOf(a){
    if (a && a.isStringTraceString) {
        return "string"
    }
    return typeof a
}

function stringTraceAdd(a, b){
    var stack = new Error().stack.split("\n")
    if (a == null){
        a = ""
    }
    if (b==null){
        b = ""
    }
    if (!a.isStringTraceString && typeof a === "string"){
        a = stringTrace(a);
    }
    if (!b.isStringTraceString && typeof b === "string"){
        b = stringTrace(b);
    }
    if (!a.isStringTraceString) {
        return a + b;// not a string operation i think, could still be inferred to a stirng tho
    }

    var newValue = a.toString() + b.toString();
    return makeTraceObject({
        value: newValue,
        origin: makeOrigin({
            action: "concat",
            value: newValue,
            inputValues: [a, b]
        })
    })
}

function stringTraceNotTripleEqual(a,b){
    if (a && a.isStringTraceString) {
        a = a.toString()
    }
    if(b && b.isStringTraceString) {
        b = b.toString();
    }
    return a !== b;
}

function stringTraceTripleEqual(a,b){
    return !stringTraceNotTripleEqual(a,b)
}



function stringTraceSetInnerHTML(el, innerHTML){
    el.innerHTML = innerHTML


    mapInnerHTMLAssignment(el, innerHTML, "Ancestor innerHTML")


}

function tagTypeHasClosingTag(tagName){
    return originalCreateElement.apply(document, [tagName]).outerHTML.indexOf("></") !== -1
}
window.tagTypeHasClosingTag = tagTypeHasClosingTag

if (!window.tracingEnabled){
    enableTracing()
}

window.stringTraceTripleEqual = stringTraceTripleEqual
window.stringTraceNotTripleEqual = stringTraceNotTripleEqual
window.stringTrace = stringTrace
window.stringTraceUseValue = stringTraceUseValue
window.stringTraceTypeOf = stringTraceTypeOf
window.stringTraceSetInnerHTML = stringTraceSetInnerHTML
window.stringTraceAdd = stringTraceAdd

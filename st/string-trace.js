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

console.log("in stringtrace js")

import {enableTracing, disableTracing} from "../src/tracing/tracing"

console.log("adding")
window.addEventListener("load", function(){
    console.log("processElementsAvailableOnInitialLoad")
    if (window.isSerializedDomPage){return}
    processElementsAvailableOnInitialLoad();
})






function makeOrigin(opts){
    return new Origin(opts)

}



function stringTrace(value){
    return makeTraceObject({
        value: value,
        origin: makeOrigin({
            action: "string literal",
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
    var innerHTMLAfterAssignment = el.innerHTML

    var forDebuggingProcessedHtml = ""
    var charOffset = 0;
    var extraCharsAdded = 0;
    processNewInnerHtml(el)


    function processNewInnerHtml(el){
        var children = Array.prototype.slice.apply(el.childNodes, [])
        addElOrigin(el, "replaceContents", {
            action: "ancestor innerHTML",
            children: children
        })

        $(el).contents().each(function(i, child){
            var isTextNode = child.innerHTML === undefined;
            if (isTextNode) {
                addElOrigin(child, "textValue", {
                    "action": "ancestor innerHTML",
                    inputValues: [innerHTML],
                    value: innerHTMLAfterAssignment,
                    inputValuesCharacterIndex: [charOffset]
                })
                console.log(child.textContent, " ==? ",innerHTMLAfterAssignment.substr(charOffset, child.textContent.length),
                    innerHTMLAfterAssignment.substr(charOffset, child.textContent.length) == child.textContent)
                charOffset += child.textContent.length
                forDebuggingProcessedHtml += child.textContent
            } else {

                addElOrigin(child, "tagName", {
                    action: "ancestor innerHTML",
                    inputValues: [innerHTML],
                    inputValuesCharacterIndex: [charOffset],
                    value: innerHTMLAfterAssignment
                })
                var openingTagStart = "<" + child.tagName
                charOffset += openingTagStart.length
                forDebuggingProcessedHtml += openingTagStart

                for (var i = 0;i<child.attributes.length;i++) {
                    var attr = child.attributes[i]

                    var charOffsetBefore = charOffset

                    var attrStr = " " + attr.name
                    attrStr += "='" + attr.textContent +  "'"

                    charOffset += attrStr.length
                    if (attr.textContent === ""){
                        //charOffset += "'='".length
                        extraCharsAdded += "'='".length
                    }

                    addElOrigin(child, "attribute_" + attr.name, {
                        action: "ancestor innerHTML",
                        inputValues: [innerHTML],
                        value: innerHTMLAfterAssignment,
                        inputValuesCharacterIndex: [charOffsetBefore],
                        extraCharsAdded: extraCharsAdded
                    })



                    forDebuggingProcessedHtml += attrStr
                }

                var openingTagEnd = ""
                // if (!tagTypeHasClosingTag(child.tagName)) {
                //     openingTagEnd +=  "/"
                // }
                openingTagEnd += ">"
                charOffset += openingTagEnd.length
                forDebuggingProcessedHtml += openingTagEnd

                processNewInnerHtml(child)

                if (tagTypeHasClosingTag(child.tagName)) {
                    var closingTag = "</" + child.tagName + ">"
                    charOffset += closingTag.length
                    forDebuggingProcessedHtml += closingTag
                }
            }
            console.log("processed", forDebuggingProcessedHtml, innerHTML.toString().toLowerCase().replace(/\"/g, "'") === forDebuggingProcessedHtml.toLowerCase())

        })
    }

    // if (innerHTML.toString().toLowerCase().replace(/\"/g, "'") !== forDebuggingProcessedHtml.toLowerCase()){
    //     debugger;
    // }


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


require("./getVisData")
import Origin from "../src/origin"
var $ = require("jquery")
var ValueMap = require("../src/value-map")
var _ = require("underscore")
window.stringTraceCompile = require("../process-javascript-code")

import processElementsAvailableOnInitialLoad from "../src/tracing/processElementsAvailableOnInitialLoad"

import addElOrigin from "../src/tracing/addElOrigin"



console.log("in stringtrace js")

import {enableTracing, disableTracing} from "../src/tracing/tracing"

console.log("adding")
window.addEventListener("load", function(){
    console.log("processElementsAvailableOnInitialLoad")
    if (window.isSerializedDomPage){return}
    if (window.isVis){return}
    processElementsAvailableOnInitialLoad();
})

import babelFunctions from "../src/tracing/babelFunctions"

Object.keys(babelFunctions).forEach(function(functionName){
    window[functionName] = babelFunctions[functionName]
})


function tagTypeHasClosingTag(tagName){
    return originalCreateElement.apply(document, [tagName]).outerHTML.indexOf("></") !== -1
}
window.tagTypeHasClosingTag = tagTypeHasClosingTag

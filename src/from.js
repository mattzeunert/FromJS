require("../st/getVisData")

import processElementsAvailableOnInitialLoad from "../src/tracing/processElementsAvailableOnInitialLoad"

import {enableTracing, disableTracing} from "../src/tracing/tracing"

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

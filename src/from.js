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

import saveAndSerializeDOMState from "./ui/saveAndSerializeDOMState"
window.saveAndSerializeDOMState = saveAndSerializeDOMState

Object.keys(babelFunctions).forEach(function(functionName){
    window[functionName] = babelFunctions[functionName]
})

if (!window.isSerializedDomPage){
    enableTracing()
}

import initSerializedDataPage from "../src/ui/initSerializedDataPage"
import showFromJSSidebar from "../src/ui/showFromJSSidebar"


setTimeout(function(){
    if (window.isSerializedDomPage){
        initSerializedDataPage(showFromJSSidebar);
    } else {
        setTimeout(function(){
            if (window.isVis) {
                return;
            }

            showFromJSSidebar()
        }, 4000)
    }
}, 100)

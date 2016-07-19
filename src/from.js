import processElementsAvailableOnInitialLoad from "../src/tracing/processElementsAvailableOnInitialLoad"
import {enableTracing, disableTracing} from "../src/tracing/tracing"
import babelFunctions from "../src/tracing/babelFunctions"
import saveAndSerializeDOMState from "./ui/saveAndSerializeDOMState"
import initSerializedDataPage from "../src/ui/initSerializedDataPage"
import showFromJSSidebar from "../src/ui/showFromJSSidebar"
import $ from "jquery"


document.onreadystatechange = function(e){
    if (document.readyState === "interactive") {
        if (window.isSerializedDomPage){return}
        if (window.isVis){return}
        // it's hard to know when I should do this
        // e.g. it's possible that some JS runs inbetween the page HTML
        // and modifies the DOM
        // for now I'm hoping the inspected app is waiting for document ready
        // ... maybe processing as soon as the page tries to do something
        // like appendChild or similar collect inital html
        processElementsAvailableOnInitialLoad();
    }
}


window.saveAndSerializeDOMState = saveAndSerializeDOMState

Object.keys(babelFunctions).forEach(function(functionName){
    window[functionName] = babelFunctions[functionName]
})
if (!window.isSerializedDomPage){
    enableTracing()
}

setTimeout(function(){
    if (window.isSerializedDomPage){
        initSerializedDataPage(showFromJSSidebar);
    } else {
        setTimeout(function(){
            if (window.isVis) {
                return;
            }

            var btn = $("<button>")
            btn.text("Disable interactions and show analysis")
            btn.click(function(e){
                showFromJSSidebar()
                e.stopPropagation();
            })
            btn.css({
                position: "fixed",
                top: 0,
                right: 0,
                background: "blue",
                color: "white",
                padding: "10px"
            })
            $("body").append(btn)
        }, 4000)
    }
}, 100)

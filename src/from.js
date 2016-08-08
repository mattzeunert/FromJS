console.log("at top of from.js")
import {makeSureInitialHTMLHasBeenProcessed} from "./tracing/processElementsAvailableOnInitialLoad"
import {enableTracing, disableTracing} from "./tracing/tracing"
import {addBabelFunctionsToGlobalObject} from "./tracing/babelFunctions"
import saveAndSerializeDOMState from "./ui/saveAndSerializeDOMState"
import initSerializedDataPage from "./ui/initSerializedDataPage"
import showFromJSSidebar from "./ui/showFromJSSidebar"
import $ from "jquery"

// console.log = function(){}
// console.trace = function(){}

console.log("in from.js")
console.profile()
console.time("Page Load")
document.addEventListener("readystatechange", onReadyStateChange)

function onReadyStateChange(e){
    // we might be listenting too late for "interactive", so on some pages we might just get "complete"
    if (document.readyState === "interactive" || document.readyState === "complete") {
        if (window.isSerializedDomPage){return}
        if (window.isVis){return}
        // it's hard to know when I should do this
        // e.g. it's possible that some JS runs inbetween the page HTML
        // and modifies the DOM
        // for now I'm hoping the inspected app is waiting for document ready
        // ... maybe processing as soon as the page tries to do something
        // like appendChild or similar collect inital html
        makeSureInitialHTMLHasBeenProcessed();


        onDoneProcessing(function(){
            console.timeEnd("Page Load")
            console.profileEnd()
        })

        document.removeEventListener("readystatechange", onReadyStateChange)
    }
}

function onDoneProcessing(doneProcessing){
    var lastTimes = [];

    function measure(done){
        var lastDate = new Date();
        setTimeout(function(){
            var now = new Date();
            lastTimes.push(now.valueOf() - lastDate.valueOf());
            if (lastTimes.length > 10){
                lastTimes.shift();
            }
            done()
        }, 10)
    }

    measure(doneMeasuring)
    function doneMeasuring(){
        console.log(lastTimes)
        var hasValuesOver15ms = lastTimes.filter((n) => n > 15).length > 0
        if (lastTimes.length < 5 || hasValuesOver15ms) {
            measure(doneMeasuring)
        }
        else {
            doneProcessing()
        }

    }
}


window.saveAndSerializeDOMState = saveAndSerializeDOMState

addBabelFunctionsToGlobalObject();

if (!window.isSerializedDomPage){
    enableTracing()
}

$(document).ready(function(){
    if (window.isSerializedDomPage){
        initSerializedDataPage(showFromJSSidebar);
    } else {
        setTimeout(function(){
            if (window.isVis) {
                return;
            }

            var btn = $("<button>")
            btn.text("Show FromJS Inspector")
            btn.click(function(e){
                showFromJSSidebar()
                e.stopPropagation();
            })
            btn.addClass("fromjs-show-inspector-button")
            $("body").append(btn)
        }, 1000)
    }
})

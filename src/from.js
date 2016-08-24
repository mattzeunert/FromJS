if (isMobile() && location.href.indexOf("/react-") !== -1){
    var div = document.createElement("div")
    div.innerHTML = `<div class="fromjs-no-phone-support-warning">
        If you're on a phone,
        <a href="/todomvc">this demo might work better<a>.<br/>
        Or go to the <a href="/">FromJS homepage</a>.
    </div>`
    document.documentElement.appendChild(div)
}

import {makeSureInitialHTMLHasBeenProcessed} from "./tracing/processElementsAvailableOnInitialLoad"
import {enableTracing, disableTracing} from "./tracing/tracing"
import {addBabelFunctionsToGlobalObject} from "./tracing/babelFunctions"
import saveAndSerializeDOMState from "./ui/saveAndSerializeDOMState"
import initSerializedDataPage from "./ui/initSerializedDataPage"
import showFromJSSidebar from "./ui/showFromJSSidebar"
import $ from "jquery"
import isMobile from "./isMobile"

// console.log("in from.js")
// console.profile()
// console.time("Page Load")

// onDoneProcessing(function(){
//     console.timeEnd("Page Load")
//     console.profileEnd()
// })
//
// function onDoneProcessing(doneProcessing){
//     var lastTimes = [];
//
//     function measure(done){
//         var lastDate = new Date();
//         setTimeout(function(){
//             var now = new Date();
//             lastTimes.push(now.valueOf() - lastDate.valueOf());
//             if (lastTimes.length > 10){
//                 lastTimes.shift();
//             }
//             done()
//         }, 10)
//     }
//
//     measure(doneMeasuring)
//     function doneMeasuring(){
//         console.log(lastTimes)
//         var hasValuesOver15ms = lastTimes.filter((n) => n > 15).length > 0
//         if (lastTimes.length < 5 || hasValuesOver15ms) {
//             measure(doneMeasuring)
//         }
//         else {
//             doneProcessing()
//         }
//
//     }
// }



setTimeout(function(){
    // hook for Chrome Extension to proceed when FromJS has been set up
    window.fromJSIsReady = true;
    if (window.onFromJSReady) {
        window.onFromJSReady();
    }
},0)

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
                btn.remove()
                showFromJSSidebar()
                e.stopPropagation();
            })
            btn.addClass("fromjs-show-inspector-button")
            $("body").append(btn)
        }, 0)
    }
})

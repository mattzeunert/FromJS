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
import {initializeSidebarContent, showShowFromJSInspectorButton} from "./ui/showFromJSSidebar"
import $ from "jquery"
import isMobile from "./isMobile"
import createResolveFrameWorker from "./createResolveFrameWorker"
import sendMessageToBackgroundPage from "./sendMessageToBackgroundPage"


window.saveAndSerializeDOMState = saveAndSerializeDOMState

addBabelFunctionsToGlobalObject();

window.fromJSEnableTracing = enableTracing
window.fromJSDisableTracing = disableTracing

var resolveFrameWorker = createResolveFrameWorker()
resolveFrameWorker.beforePostMessage = disableTracing
resolveFrameWorker.afterPostMessage = enableTracing
resolveFrameWorker.on("fetchUrl", function(url, cb){
    if (window.isExtension) {
        sendMessageToBackgroundPage({
            type: "fetchUrl",
            url: url
        }, cb)
    } else {
        var r = new XMLHttpRequest();
        r.addEventListener("load", function(){
            cb(r.responseText)
        });
        r.open("GET", url);
        r.send();
    }
})



if (document.readyState === "complete") {
    setTimeout(onReady, 0)
} else {
    document.addEventListener("readystatechange", function(){
        if (document.readyState === "complete") {
            onReady()
        }
    })
}


function onReady(){
    // hook for Chrome Extension to proceed when FromJS has been set up
    window.fromJSIsReady = true;
    if (window.onFromJSReady) {
        window.onFromJSReady();
    }

    showShowFromJSInspectorButton(resolveFrameWorker)
}

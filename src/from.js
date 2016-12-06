import isMobile from "./isMobile"
var browserIsChrome = /chrom(e|ium)/.test(navigator.userAgent.toLowerCase());
var unsupportedEnvironment = isMobile() || !browserIsChrome
if (unsupportedEnvironment && location.href.indexOf("/react-") !== -1){
    var div = document.createElement("div")
    div.innerHTML = `<div class="fromjs-unsupported-device">
        FromJS only works on Chrome Desktop.<br><br>
        You can watch some <a href="http://www.fromjs.com/recordings.html">demo videos</a> on the FromJS website instead.
        This older <a href="http://www.fromjs.com/todomvc/">Backbone TodoMVC example</a> might sort of work on your device.
    </div>`
    document.documentElement.appendChild(div)
    throw Error("Don't bother trying to run FromJS on this device")
}

import {makeSureInitialHTMLHasBeenProcessed} from "./tracing/processElementsAvailableOnInitialLoad"
import {enableTracing, disableTracing, runFunctionWithTracingDisabled} from "./tracing/tracing"
import {addBabelFunctionsToGlobalObject} from "./tracing/babelFunctions"
import {initializeSidebarContent, showShowFromJSInspectorButton} from "./ui/showFromJSSidebar"
import $ from "jquery"
import createResolveFrameWorker from "./createResolveFrameWorker"
import sendMessageToBackgroundPage from "./sendMessageToBackgroundPage"
import DynamicCodeRegistry from "./DynamicCodeRegistry"
import {showFromJSSidebarOnPlaygroundPage} from "./ui/showFromJSSidebar"

window.fromJSVersion = `${VERSION}-${GIT_COMMIT.substr(0,7)}`
window.dynamicCodeRegistry = new DynamicCodeRegistry()

addBabelFunctionsToGlobalObject();

window.fromJSEnableTracing = enableTracing
window.fromJSDisableTracing = disableTracing

var resolveFrameWorker = createResolveFrameWorker()
if (!window.isPlayground) {
    resolveFrameWorker.postMessageWrapper = function(doPostMessage){
        runFunctionWithTracingDisabled(doPostMessage)
    }
}
resolveFrameWorker.on("fetchUrl", function(url, cb){
    if (window.isExtension) {
        sendMessageToBackgroundPage({
            type: "fetchUrl",
            url: url
        }, cb)
    } else {
        var r = new XMLHttpRequest();
        r.addEventListener("load", function(){
            cb(f__useValue(r.responseText))
        });
        r.open("GET", url);
        r.send();
    }
})

dynamicCodeRegistry.on("register", function(newFiles){
    runFunctionWithTracingDisabled(function(){
        resolveFrameWorker.send("registerDynamicFiles", newFiles, function(){})
    })
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

window.extensionShowFromJSInspectorButton = function(){
    showShowFromJSInspectorButton(resolveFrameWorker)
}

window.playgroundShowSidebar = function(){
    showFromJSSidebarOnPlaygroundPage(resolveFrameWorker)
}

function onReady(){
    // extension replaces body html after head has loaded, so wait until that
    // has been done before showing the button
    if (!window.isExtension && !window.isPlayground) {
        showShowFromJSInspectorButton(resolveFrameWorker)
    }
}

function makeConsoleFunctionWorkWithTrackedStrings(fnName){
    var originalFn = console[fnName];
    console[fnName] = function(){
        var args = Array.from(arguments);
        args = args.map(f__useValue);
        return originalFn.apply(this, args);
    }
}
makeConsoleFunctionWorkWithTrackedStrings("log")
makeConsoleFunctionWorkWithTrackedStrings("warn")
makeConsoleFunctionWorkWithTrackedStrings("error")

if (location.hash === "#speed-up-execution-and-break-tracing") {
    window.speedUpExecutionAndBreakTracing
    window.Error = function(){

    }
}

if (window.isExtension) {
    window.onAfterBodyHTMLInserted = function(){
        makeSureInitialHTMLHasBeenProcessed();
        window.extensionShowFromJSInspectorButton()
    }
}

if (window.isExtension) {
        // measureTodoMVCRenderingTime()

    function measureTodoMVCRenderingTime(){
        // see perf.txt for more info
        console.time("TodoMVC Rendering")
        var start = new Date();

        checkIfDone();
        function checkIfDone(){
            if (document.querySelectorAll("ul.todo-list li").length > 0){
                console.timeEnd("TodoMVC Rendering")
                var time = new Date().valueOf() - start.valueOf();
                alert("TodoMVC took " + time + "s to render")
            } else {
                setTimeout(checkIfDone, 10)
            }
        }
    }
}

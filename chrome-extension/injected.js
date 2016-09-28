import {getScriptElements} from "../src/getJSScriptTags"
import _ from "underscore"
import getHeadAndBodyContent from "./getHeadAndBodyContent"

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

window.onFromJSReady = function(){
    console.log("Loading page from FromJS")

    // measureTodoMVCRenderingTime()

    window.fromJSInitialPageHtml = pageHtml;
    var bodyContent, headContent;

    var headAndBody = getHeadAndBodyContent(pageHtml)
    var bodyScripts = getScriptElements(headAndBody.bodyContent);

    if (headAndBody.headContent) {
        document.head.innerHTML = headAndBody.headContent
        var headScripts = getScriptElements(headAndBody.headContent);
        window.fromJSEnableTracing() // be careful calling global functions like regexp.exec, array.join etc after this
        appendScriptsOneAfterAnother(headScripts, document.head, function(){
            loadBody()
        })
    } else {
        window.fromJSEnableTracing()
        loadBody()
    }

    function loadBody(){
        document.body.innerHTML = headAndBody.bodyContent
        makeSureInitialHTMLHasBeenProcessed()
        appendScriptsOneAfterAnother(bodyScripts, document.body, function(){
            simulateOnLoad()
        })
    }
}

// Normally this file is loaded before fromJS is ready, but sometimes not
if (window.fromJSIsReady) {
    window.onFromJSReady()
}

function simulateOnLoad(){
    if (document.body.onload) {
        document.body.onload({});
    }

    window.dispatchEvent(new Event("DOMContentLoaded"))
    document.dispatchEvent(new Event("DOMContentLoaded"))

    // I can't override document.readyState, so it will always be "complete" and never "loading"
    document.dispatchEvent(new Event("readystatechange"))

    window.dispatchEvent(new Event("load"))
    document.dispatchEvent(new Event("load"))
}

function sendMessageToBackgroundPage(data, callback){
    var callbackName = "fromJSBackgroundMessageCallback" + _.uniqueId()
    window[callbackName] = function(){
        delete window[callbackName];
        callback.apply(this, arguments);
    }
    data.callbackName = callbackName;

    data.isFromJSExtensionMessage = true
    var event = new CustomEvent("RebroadcastExtensionMessage", {detail: data});
    window.dispatchEvent(event);
}

function appendScriptsOneAfterAnother(scripts, container, done){
    next()
    function next(){
        if (scripts.length === 0) {
            done();
            return
        }
        var script = scripts.shift()
        if (nativeInnerHTMLDescriptor.get.call(script) === ""){
            // Do this rather than appending script element, because
            // requests on https may be cross origin
            sendMessageToBackgroundPage({
                type: "loadScript",
                url: script.src
            }, function(){
                next();
            })

            // script.onload = function(){
            //     next();
            // }
            // script.onerror = function(err){
            //     console.warn("Error loading script", script, err)
            //     next();
            // }
            // container.appendChild(script)
        } else {
            container.appendChild(script)
            next();
        }
    }
}

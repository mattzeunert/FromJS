import {getScriptElements} from "../src/getJSScriptTags"
import _ from "underscore"
import getHeadAndBodyContent from "./getHeadAndBodyContent"
import sendMessageToBackgroundPage from "../src/sendMessageToBackgroundPage"

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

window.isExtension = true;

window.onFromJSReady = function(){
    console.log("Loading page from FromJS")

    // measureTodoMVCRenderingTime()

    window.fromJSInitialPageHtml = pageHtml;
    var bodyContent, headContent;

    var headAndBody = getHeadAndBodyContent(pageHtml)
    var bodyScripts = getScriptElements(headAndBody.bodyContent);

    if (headAndBody.headContent) {
        var headScripts = getScriptElements(headAndBody.headContent);
    }

    window.fromJSEnableTracing() // be careful calling global functions like regexp.exec, array.join etc after this
    if (headAndBody.headContent) {
        document.head.innerHTML = headAndBody.headContent
        appendScriptsOneAfterAnother(headScripts, document.head, function(){
            loadBody()
        })
    } else {
        loadBody()
    }

    function loadBody(){
        document.body.innerHTML = headAndBody.bodyContent
        makeSureInitialHTMLHasBeenProcessed()
        window.extensionShowFromJSInspectorButton()
        appendScriptsOneAfterAnother(bodyScripts, document.body, function(){
            simulateOnLoad()
        })
    }
}

// Normally this file is loaded before fromJS is ready, but sometimes not
if (window.fromJSIsReady) {
    debugger; // this shoudln't happen! if it does the logic for inhibiting js execution is wrong
    window.onFromJSReady()
}

function simulateOnLoad(){
    f__setDocumentReadyState("interactive")

    if (document.body.onload) {
        document.body.onload({});
    }
    window.dispatchEvent(new Event("DOMContentLoaded"))
    document.dispatchEvent(new Event("DOMContentLoaded"))
    document.dispatchEvent(new Event("readystatechange"))

    f__setDocumentReadyState("complete")
    window.dispatchEvent(new Event("load"))
    document.dispatchEvent(new Event("load"))
    document.dispatchEvent(new Event("readystatechange"))
}



function appendScriptsOneAfterAnother(scripts, container, done){
    next()
    function next(){
        if (scripts.length === 0) {
            done();
            return
        }
        var script = scripts.shift()
        console.log("loading script", script)

        if (nativeInnerHTMLDescriptor.get.call(script) === ""){
            // Do this rather than appending script element, because
            // requests on https may be cross origin
            sendMessageToBackgroundPage({
                type: "loadScript",
                url: script.src
            }, function(){
                next();
            })
        } else {
            container.appendChild(script)
            next();
        }
    }
}

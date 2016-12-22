import {getScriptElements} from "../src/getJSScriptTags"
import _ from "underscore"
import getHeadAndBodyContent from "./getHeadAndBodyContent"
import sendMessageToBackgroundPage from "../src/sendMessageToBackgroundPage"
import CodePreprocessor from "../src/tracing/code-preprocessor"

var nativeAppendChild = Node.prototype.appendChild

window.createCodePreprocessor(CodePreprocessor)
window.__sendMessageToBackgroundPage = function(type, data, callback){
    data = {...data, type}
    sendMessageToBackgroundPage(data, callback)
}
window.__loadScriptTag = function(script, callback, container){
    if (!container){
        container = document.body
    }

    if (nativeInnerHTMLDescriptor.get.call(script) === ""){
        // Do this rather than appending script element, because
        // requests on https may be cross origin
        sendMessageToBackgroundPage({
            type: "loadScript",
            url: script.src
        }, function(){
            script.readyState = "complete"
            if (script.onload) {
                var e = {
                    type: "load"
                }
                script.onload(e)
            }
            callback();
        })
    } else {
        nativeAppendChild.apply(container, [script])
        callback();
    }
}
window.isExtension = true;


console.log("inside Injected.js")
window.originalCreateElement = document.createElement
window.nativeInnerHTMLDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML")

if (!window.onAfterBodyHTMLInserted) {
    window.onAfterBodyHTMLInserted = function(){}
}
if (!window.enableNativeMethodPatching){
    window.enableNativeMethodPatching = function(){
        window.codePreprocessor.enable();
    }
}
if (!window.disableNativeMethodPatching){
    window.disableNativeMethodPatching = function(){
        window.codePreprocessor.disable();
    }
}

window.startLoadingPage = function(loadingMessagePrefix){
    if (!loadingMessagePrefix) {
        loadingMessagePrefix = "";
    }
    console.info(loadingMessagePrefix + "Loading page...")
    window.forTestsIsLoadingPage = true;


    window.fromJSInitialPageHtml = pageHtml;
    var bodyContent, headContent;

    var headAndBody = getHeadAndBodyContent(pageHtml)
    var bodyScripts = getScriptElements(headAndBody.bodyContent);

    if (headAndBody.headContent) {
        var headScripts = getScriptElements(headAndBody.headContent);
    }


    if (headAndBody.headContent) {
        document.head.innerHTML = headAndBody.headContent
        enableNativeMethodPatching() // be careful calling global functions like regexp.exec, array.join etc after this
        appendScriptsOneAfterAnother(headScripts, document.head, function(){
            loadBody()
        })
    } else {
        loadBody()
    }

    function loadBody(){
        disableNativeMethodPatching();
        document.body.innerHTML = headAndBody.bodyContent
        enableNativeMethodPatching();
        onAfterBodyHTMLInserted()
        appendScriptsOneAfterAnother(bodyScripts, document.body, function(){
            simulateOnLoad()
        })
    }

    function appendScriptsOneAfterAnother(scripts, container, done){
        next()
        function next(){
            if (scripts.length === 0) {
                done();
                return
            }
            var script = scripts.shift()
            console.log(loadingMessagePrefix + "Loading script", script)

            __loadScriptTag(script, next, container)
        }
    }
}

function simulateOnLoad(){
    f__setDocumentReadyState("interactive")

    window.dispatchEvent(new Event("DOMContentLoaded"))
    document.dispatchEvent(new Event("DOMContentLoaded"))
    document.dispatchEvent(new Event("readystatechange"))

    f__setDocumentReadyState("complete")
    window.dispatchEvent(new Event("load"))
    document.dispatchEvent(new Event("load"))
    document.dispatchEvent(new Event("readystatechange"))
}

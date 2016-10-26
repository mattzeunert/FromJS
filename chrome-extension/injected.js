import {getScriptElements} from "../src/getJSScriptTags"
import _ from "underscore"
import getHeadAndBodyContent from "./getHeadAndBodyContent"
import sendMessageToBackgroundPage from "../src/sendMessageToBackgroundPage"


window.isExtension = true;

window.onFromJSReady = function(){
    console.info("FromJS: Loading page...")

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
        console.log("FromJS: Loading script", script)

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

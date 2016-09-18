import $ from "jquery"
import React from "react"
import ReactDOM from "react-dom"
import isMobile from "../isMobile"
import _ from "underscore"
import whereDoesCharComeFrom from "../whereDoesCharComeFrom"
import getRootOriginAtChar from "../getRootOriginAtChar"
import { OriginPath, PreviewElementMarker, SelectedElementMarker } from "../ui/ui"
import {disableTracing, enableTracing, disableEventListeners, enableEventListeners} from "../tracing/tracing"
import RoundTripMessageWrapper from "../RoundTripMessageWrapper"
import resolveFrame from "../resolve-frame"
import getCodeFilePath from "./getCodeFilePath"
import { getOriginById } from "../origin"

var elementsByElementId = {}

export default function showFromJSSidebar(){
    disableTracing()

    var container = document.createElement("div")
    container.className = "fromjs-outer-container"

    var container2 = document.createElement("div")
    container2.id = "fromjs-sidebar"

    var sidebarIframe = document.createElement("iframe")
    sidebarIframe.setAttribute("style", "width: 100%; height: 100%; box-shadow: 0px 0px 20px gray;border: none")

    container2.appendChild(sidebarIframe)
    container.appendChild(container2)

    document.body.appendChild(container)
    sidebarIframe.contentDocument.write(`
        <!doctype html>
        <html>
            <head></head>
            <body>
                <div id='content'>Loading Inspector UI...</div>
                <link rel="stylesheet" href="/fromjs-internals/fromjs.css">
                <script src="/fromjs-internals/inspector.js" charset="utf-8"></script>
            </body>
        </html>
    `)



    window.resolveFrameWrapper.send("registerDynamicFiles", fromJSDynamicFiles, function(){})


    var elementMarkerContainer = document.createElement("div")
    container.appendChild(elementMarkerContainer)

    var previewElementMarkerContainer = document.createElement("div")
    elementMarkerContainer.appendChild(previewElementMarkerContainer)

    var selectedElementMarkerContainer = document.createElement("div")
    elementMarkerContainer.appendChild(selectedElementMarkerContainer)

    function shouldHandle(e) {
        if ($(e.target).closest("#fromjs-sidebar").length !== 0) {
            return false
        }
        if ($(e.target).is("html, body")) {
            return false
        }
        return true
    }

    disableEventListeners()

    window.addEventListener("message", function(e){
        console.log("inspected page has message", e.data)
    })

    var inspectedPage = new RoundTripMessageWrapper(sidebarIframe.contentWindow, "Inspected App/Sidebar")

    var currentSelectedElement = null;
    var currentPreviewedElement = null;
    var nonElementOriginSelected = false;
    // We already disable event listeners created with addEventListener
    // but not e.g. onclick attributes, or prevent checkboxes
    // from being toggled and links from being clicked (preventDefault)
    $("body").on("click.fromjs", function(e){
        if (!shouldHandle(e)) {return}

        e.stopPropagation();
        e.preventDefault();
        setCurrentSelectedElement(e.target)
    })

    function setCurrentSelectedElement(el){
        currentSelectedElement = el
        nonElementOriginSelected = false;
        inspectedPage.send("selectElement", serializeElement(el))
        updateSelectionMarker();
    }

    function updateSelectionMarker(){
        if (!nonElementOriginSelected) {
            ReactDOM.render(<SelectedElementMarker el={currentSelectedElement}/>, selectedElementMarkerContainer)
        } else {
            selectedElementMarkerContainer.innerHTML = "";
        }
    }


    inspectedPage.on("UISelectParentElement", function(){
        var newSelectedEl = currentSelectedElement.parentNode;
        setCurrentSelectedElement(newSelectedEl)
    })

    inspectedPage.on("UISelectNonElementOrigin", function(){
        nonElementOriginSelected = true;
        updateSelectionMarker();
    })

    inspectedPage.on("UICloseInspector", function(){
        sidebarIframe.remove();
        container.remove();
        showShowFromJSInspectorButton();
        inspectedPage.close()

        $("body").css("padding-right", "0")

        enableEventListeners();
        $("body").off("click.fromjs")
        $("*").off("mouseleave.fromjs mouseenter.fromjs keydown.fromjs")

        enableTracing();
    })

    inspectedPage.on("resolveFrame", function(frameString, callback){
        resolveFrameWrapper.send("resolveFrame", frameString, callback)
    })


    inspectedPage.on("getRootOriginAtChar", function(elementId, characterIndex, callback){
        var el = getElementFromElementId(elementId)
        var initialStep = getRootOriginAtChar(el, characterIndex)
        initialStep = serializeStep(initialStep)
        callback(initialStep)
    })

    function serializeStep(s) {
        var originObject = s.originObject;
        var isRootOrigin = false;
        if (!originObject) {
            // Data model is a bit inconsistent between a step
            // and a root origin
            isRootOrigin = true
            originObject = s.origin
        }
        originObject = originObject.serialize();
        return {
            characterIndex: s.characterIndex,
            [isRootOrigin ? "origin" : "originObject"]: originObject
        }
    }

    inspectedPage.on("whereDoesCharComeFrom", function(originId, characterIndex, callback){
        var origin = getOriginById(originId)
        whereDoesCharComeFrom(origin, characterIndex, function(steps){
            steps = steps.map(serializeStep)
            callback(steps)
        })
    })

    inspectedPage.on("getCodeFilePath", function(fileName, callback){
        getCodeFilePath(fileName, callback)
    })

    function getElementFromElementId(elementId){
        return elementsByElementId[elementId]
    }

    function serializeElement(el) {
        if (el === null) {
            return null;
        }
        if (!el.__fromJSElementId) {
            el.__fromJSElementId = _.uniqueId()
            elementsByElementId[el.__fromJSElementId] = el
        }
        return {
            __fromJSElementId: el.__fromJSElementId,
            outerHTML: el.outerHTML,
            innerHTML: el.innerHTML,
        }
    }

    function setCurrentPreviewedElement(el){
        currentPreviewedElement = el

        inspectedPage.send("previewElement", serializeElement(el))
        ReactDOM.render(<PreviewElementMarker el={currentPreviewedElement}/>, previewElementMarkerContainer)
    }

    if (!isMobile()){
        $("*").on("keydown.fromjs", function(e){
            e.preventDefault(); // prevent people typing into input fields etc
        })
        $("*").on("mouseenter.fromjs", function(e){
            if (!shouldHandle(e)) {return}
            e.stopPropagation()
            setCurrentPreviewedElement(e.target)
        })
        $("*").on("mouseleave.fromjs", function(e){
            if (!shouldHandle(e)) {return}
            setCurrentPreviewedElement(null)
        })
    }

    if (isMobile()){
        $("body").css("padding-right", "56vw")
        $("body").css("padding-left", "1vw")
        $("#fromjs-sidebar").css("width", "55vw")
        $("body").addClass("fromjsIsMobile")
    } else {
        $("body").css("padding-right", "40vw")
    }

}

export function showShowFromJSInspectorButton(){
    var btn = $("<button>")
    btn.text("Show FromJS Inspector")
    btn.click(function(e){
        btn.remove()
        showFromJSSidebar()
        e.stopPropagation();
    })
    btn.addClass("fromjs-show-inspector-button toggle-inspector-button")
    $("body").append(btn)
}

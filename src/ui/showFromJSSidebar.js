import $ from "jquery"
import React from "react"
import ReactDOM from "react-dom"
import isMobile from "../isMobile"
import _ from "underscore"
import whereDoesCharComeFrom from "../whereDoesCharComeFrom"
import getRootOriginAtChar from "../getRootOriginAtChar"
import { OriginPath, PreviewElementMarker, SelectedElementMarker } from "../ui/ui"
import {disableTracing, enableTracing, disableEventListeners, enableEventListeners,runFunctionWithTracingDisabled} from "../tracing/tracing"
import RoundTripMessageWrapper from "../RoundTripMessageWrapper"
import getCodeFilePath from "./getCodeFilePath"

var elementsByElementId = {}

export default function showFromJSSidebar(resolveFrameWorker){
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
    var cssUrl = "/fromjs-internals/fromjs.css";
    var jsUrl = "/fromjs-internals/inspector.js";
    sidebarIframe.contentDocument.write(`
        <!doctype html>
        <html>
            <head></head>
            <body>
                <div id='content'>Loading Inspector UI...</div>
                <link rel="stylesheet" href="${cssUrl}">
                <script src="${jsUrl}" charset="utf-8"></script>
            </body>
        </html>
    `)

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

    var inspectorPage = new RoundTripMessageWrapper(sidebarIframe.contentWindow, "Inspected App/Sidebar")
    inspectorPage.beforePostMessage = disableTracing
    inspectorPage.afterPostMessage = enableTracing

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

    function setCurrentSelectedElement(el){
        currentSelectedElement = el
        nonElementOriginSelected = false;
        inspectorPage.send("selectElement", serializeElement(el))
        updateSelectionMarker();
    }

    function updateSelectionMarker(){
        if (!nonElementOriginSelected) {
            ReactDOM.render(<SelectedElementMarker el={currentSelectedElement}/>, selectedElementMarkerContainer)
        } else {
            selectedElementMarkerContainer.innerHTML = "";
        }
    }


    inspectorPage.on("UISelectParentElement", function(){
        var newSelectedEl = currentSelectedElement.parentNode;
        setCurrentSelectedElement(newSelectedEl)
    })

    inspectorPage.on("UISelectNonElementOrigin", function(){
        nonElementOriginSelected = true;
        updateSelectionMarker();
    })

    inspectorPage.on("UICloseInspector", function(){
        disableTracing();

        sidebarIframe.remove();
        container.remove();
        showShowFromJSInspectorButton(resolveFrameWorker);
        inspectorPage.close()

        $("body").css("padding-right", "0")

        enableEventListeners();
        $("body").off("click.fromjs")
        $("*").off("mouseleave.fromjs mouseenter.fromjs keydown.fromjs")

        enableTracing();
    })

    inspectorPage.on("resolveFrame", function(frameString, callback){
        resolveFrameWorker.send("resolveFrame", frameString, callback)
    })


    inspectorPage.on("getRootOriginAtChar", function(elementId, characterIndex, callback){
        var el = getElementFromElementId(elementId)
        var initialStep = getRootOriginAtChar(el, characterIndex)
        registerOriginIdsForStep(initialStep)
        initialStep = serializeStep(initialStep)
        callback(initialStep)
    })

    function serializeStep(s) {
        var originObject = s.origin;
        var isRootOrigin = false;
        originObject = originObject.serialize();
        return {
            characterIndex: s.characterIndex,
            origin: originObject
        }
    }

    // We need to a way to get an origin object by its ID
    // (which is sent by the inspector UI iframe)
    // I used to index all origins by id, but that
    // used a lot of memory
    var originsById = {}
    function getOriginById(originId){
        var origin = originsById[originId]
        if (!origin) {
            debugger;
            console.log("origin not found by id", originId)
            return
        }
        return origin;
    }
    function registerOriginIdsForStep(step){
        // current inconsistent use of originObject/origin
        var originObject = step.originObject || step.origin;

        originsById[originObject.getId()] = originObject
        originObject.inputValues.forEach(function(iv){
            if (!iv.getId) {
                // Probably an element input value... this will be filtered out by
                // .serialize later on, so it's never sent to the inspector iframe
                return iv;
            }
            originsById[iv.getId()] = iv
        })
    }

    inspectorPage.on("whereDoesCharComeFrom", function(originId, characterIndex, callback){
        runFunctionWithTracingDisabled(function(){
            var origin = getOriginById(originId)

            whereDoesCharComeFrom([origin, characterIndex], function(steps){
                steps.forEach(registerOriginIdsForStep)
                steps = steps.map(serializeStep)
                callback(steps)
            }, resolveFrameWorker)
        })
    })

    inspectorPage.on("getCodeFilePath", function(fileName, callback){
        getCodeFilePath(fileName, callback, resolveFrameWorker)
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

        inspectorPage.send("previewElement", serializeElement(el))
        ReactDOM.render(<PreviewElementMarker el={currentPreviewedElement}/>, previewElementMarkerContainer)
    }

    enableTracing();
}

export function showFromJSSidebarOnPlaygroundPage(resolveFrameWorker){
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
    var cssUrl = "/playground/fromjs/fromjs.css";
    var jsUrl = "/playground/fromjs/inspector.js"
    sidebarIframe.contentDocument.write(`
        <!doctype html>
        <html>
            <head></head>
            <body>
                <script>window.disableSelectParentElement = true</script>
                <div id='content'>Loading Inspector UI...</div>
                <link rel="stylesheet" href="${cssUrl}">
                <script src="${jsUrl}" charset="utf-8"></script>
            </body>
        </html>
    `)

    var elementMarkerContainer = document.createElement("div")
    container.appendChild(elementMarkerContainer)

    var previewElementMarkerContainer = document.createElement("div")
    elementMarkerContainer.appendChild(previewElementMarkerContainer)

    var selectedElementMarkerContainer = document.createElement("div")
    elementMarkerContainer.appendChild(selectedElementMarkerContainer)

    var inspectorPage = new RoundTripMessageWrapper(sidebarIframe.contentWindow, "Inspected App/Sidebar")
    // inspectorPage.beforePostMessage = disableTracing
    // inspectorPage.afterPostMessage = enableTracing

    var currentSelectedElement = null;
    var currentPreviewedElement = null;
    var nonElementOriginSelected = false;



    if (isMobile()){
        $("body").css("padding-right", "56vw")
        $("body").css("padding-left", "1vw")
        $("#fromjs-sidebar").css("width", "55vw")
        $("body").addClass("fromjsIsMobile")
    } else {
        $("body").css("padding-right", "40vw")
    }

    function setCurrentSelectedElement(el){
        currentSelectedElement = el
        nonElementOriginSelected = false;
        inspectorPage.send("selectElement", serializeElement(el))
        updateSelectionMarker();
    }

    function updateSelectionMarker(){
        if (!nonElementOriginSelected) {
            ReactDOM.render(<SelectedElementMarker el={currentSelectedElement}/>, selectedElementMarkerContainer)
        } else {
            selectedElementMarkerContainer.innerHTML = "";
        }
    }


    inspectorPage.on("UISelectParentElement", function(){
        var newSelectedEl = currentSelectedElement.parentNode;
        setCurrentSelectedElement(newSelectedEl)
    })

    inspectorPage.on("UISelectNonElementOrigin", function(){
        nonElementOriginSelected = true;
        updateSelectionMarker();
    })

    inspectorPage.on("UICloseInspector", function(){
        disableTracing();

        sidebarIframe.remove();
        container.remove();
        showShowFromJSInspectorButton(resolveFrameWorker);
        inspectorPage.close()

        $("body").css("padding-right", "0")

        enableEventListeners();
        $("body").off("click.fromjs")
        $("*").off("mouseleave.fromjs mouseenter.fromjs keydown.fromjs")

        enableTracing();
    })

    inspectorPage.on("resolveFrame", function(frameString, callback){
        resolveFrameWorker.send("resolveFrame", frameString, callback)
    })

    inspectorPage.on("InspectorReady", function(){
        setCurrentSelectedElement(document.querySelector("#result"))
    })


    inspectorPage.on("getRootOriginAtChar", function(elementId, characterIndex, callback){
        var el = getElementFromElementId(elementId)
        var initialStep = getRootOriginAtChar(el, characterIndex)
        registerOriginIdsForStep(initialStep)
        initialStep = serializeStep(initialStep)
        callback(initialStep)
    })

    function serializeStep(s) {
        var originObject = s.origin;
        var isRootOrigin = false;
        originObject = originObject.serialize();
        return {
            characterIndex: s.characterIndex,
            origin: originObject
        }
    }

    // We need to a way to get an origin object by its ID
    // (which is sent by the inspector UI iframe)
    // I used to index all origins by id, but that
    // used a lot of memory
    var originsById = {}
    function getOriginById(originId){
        var origin = originsById[originId]
        if (!origin) {
            debugger;
            console.log("origin not found by id", originId)
            return
        }
        return origin;
    }
    function registerOriginIdsForStep(step){
        // current inconsistent use of originObject/origin
        var originObject = step.originObject || step.origin;

        originsById[originObject.getId()] = originObject
        originObject.inputValues.forEach(function(iv){
            if (!iv.getId) {
                // Probably an element input value... this will be filtered out by
                // .serialize later on, so it's never sent to the inspector iframe
                return iv;
            }
            originsById[iv.getId()] = iv
        })
    }

    inspectorPage.on("whereDoesCharComeFrom", function(originId, characterIndex, callback){
        runFunctionWithTracingDisabled(function(){
            var origin = getOriginById(originId)

            whereDoesCharComeFrom([origin, characterIndex], function(steps){
                steps.forEach(registerOriginIdsForStep)
                steps = steps.map(serializeStep)
                callback(steps)
            }, resolveFrameWorker)
        })
    })

    inspectorPage.on("getCodeFilePath", function(fileName, callback){
        getCodeFilePath(fileName, callback, resolveFrameWorker)
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

        inspectorPage.send("previewElement", serializeElement(el))
        ReactDOM.render(<PreviewElementMarker el={currentPreviewedElement}/>, previewElementMarkerContainer)
    }
}

export function showShowFromJSInspectorButton(resolveFrameWorker){
    var btn = $("<button>")
    btn.text("Show FromJS Inspector")
    btn.click(function(e){
        btn.remove()
        showFromJSSidebar(resolveFrameWorker)
        e.stopPropagation();
    })
    btn.addClass("fromjs-show-inspector-button toggle-inspector-button")
    $("body").append(btn)
}

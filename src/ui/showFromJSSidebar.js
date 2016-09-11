import $ from "jquery"
import React from "react"
import ReactDOM from "react-dom"
import isMobile from "../isMobile"
import _ from "underscore"
import whereDoesCharComeFrom from "../whereDoesCharComeFrom"
import getRootOriginAtChar from "../getRootOriginAtChar"
import { OriginPath, FromJSView, PreviewElementMarker, SelectedElementMarker } from "../ui/ui"
import {disableTracing, enableTracing, disableEventListeners, enableEventListeners} from "../tracing/tracing"
import InspectedPage from "./InspectedPage"
import resolveFrame from "../resolve-frame"
import getCodeFilePath from "./getCodeFilePath"

export default function showFromJSSidebar(){
    disableTracing()

    var container = document.createElement("div")
    container.className = "fromjs-outer-container"

    var container2 = document.createElement("div")
    container2.id = "fromjs-sidebar"

    var sidebarIframe = document.createElement("iframe")
    sidebarIframe.setAttribute("style", "width: 100%; height: 100%")

    container2.appendChild(sidebarIframe)
    container.append(container2)

    document.body.appendChild(container)
    sidebarIframe.contentDocument.write(`
        <script>window.isFromJSSidebar = true</script>
        <link rel="stylesheet" href="/fromjs-internals/fromjs.css">
        <script src="/fromjs-internals/from.js" charset="utf-8"></script>
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

    // maybe try useCapture parameter here
    var inspectedPage = new InspectedPage(sidebarIframe)


    var currentSelectedElement = null;
    var currentPreviewedElement = null;
    // We already disable event listeners created with addEventListener
    // but not e.g. onclick attributes, or prevent checkboxes
    // from being toggled and links from being clicked (preventDefault)
    $("body").click(function(e){
        if (!shouldHandle(e)) {return}

        e.stopPropagation();
        e.preventDefault();
        setCurrentSelectedElement(e.target)
    })

    function setCurrentSelectedElement(el){
        currentSelectedElement = el
        inspectedPage.trigger("selectElement", serializeElement(el))
        ReactDOM.render(<SelectedElementMarker el={currentSelectedElement}/>, selectedElementMarkerContainer)

    }

    inspectedPage.on("UISelectParentElement", function(){
        var newSelectedEl = currentSelectedElement.parentNode;
        setCurrentSelectedElement(newSelectedEl)
    })

    inspectedPage.onResolveFrameRequest(function(frameString, callback){
        resolveFrame(frameString, callback)
    })

    inspectedPage.onGetRootOriginAtCharRequest(function(elementId, characterIndex, callback){
        var el = getElementFromElementId(elementId)
        var res = getRootOriginAtChar(el, characterIndex)
        callback(res)
    })

    inspectedPage.onWhereDoesCharComeFromRequest(function(origin, characterIndex, callback){
        whereDoesCharComeFrom(origin, characterIndex, function(steps){
            callback(steps)
        })
    })

    inspectedPage.onGetCodeFilePathRequest(function(fileName, callback){
        getCodeFilePath(fileName, callback)
    })

    var elementsByElementId = {}
    function getElementFromElementId(elementId){
        return elementsByElementId[elementId]
    }

    function serializeElement(el) {
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

    if (!isMobile()){
        $("*").mouseenter(function(e){
            if (!shouldHandle(e)) {return}
            e.stopPropagation()
            currentPreviewedElement = e.target
            ReactDOM.render(<PreviewElementMarker el={currentPreviewedElement}/>, previewElementMarkerContainer)
            inspectedPage.trigger("previewElement", serializeElement(e.target))
        })
        $("*").mouseleave(function(e){
            if (!shouldHandle(e)) {return}
            currentPreviewedElement = null
            inspectedPage.trigger("previewElement", null)
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

export function initializeSidebarContent(){
    document.write("<!doctype html><html><head></head><body></body></html>")
    ReactDOM.render(<FromJSView />, document.body)
}

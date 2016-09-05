import $ from "jquery"
import React from "react"
import ReactDOM from "react-dom"
import isMobile from "../isMobile"
import whereDoesCharComeFrom from "../whereDoesCharComeFrom"
import getRootOriginAtChar from "../getRootOriginAtChar"
import { OriginPath, FromJSView } from "../ui/ui"
import {disableTracing, enableTracing, disableEventListeners, enableEventListeners} from "../tracing/tracing"
import InspectedPage from "./InspectedPage"

export default function showFromJSSidebar(){
    disableTracing()

    var container = document.createElement("div")
    container.className = "fromjs-outer-container"
    var component;


    ReactDOM.render(<FromJSView ref={(c) => component = c}/>, container)
    document.body.appendChild(container)

    function shouldHandle(e){
        if ($(e.target).closest("#fromjs").length !== 0){
            return false
        }
        if ($(e.target).is("html, body")){
            return false
        }
        return true
    }

    disableEventListeners()

    // maybe try useCapture parameter here
    var inspectedPage = InspectedPage.getCurrentInspectedPage();


    var currentSelectedElement = null;
    var currentPreviewedElement = null;
    // We already disable event listeners created with addEventListener
    // but not e.g. onclick attributes, or prevent checkboxes
    // from being toggled and links from being clicked (preventDefault)
    $("body").click(function(e){
        if (!shouldHandle(e)) {return}

        e.stopPropagation();
        e.preventDefault();
        currentSelectedElement = e.target
        inspectedPage.trigger("selectElement", e.target)
    })

    inspectedPage.on("UISelectParentElement", function(){
        var newSelectedEl = currentSelectedElement.parentNode;
        currentSelectedElement = newSelectedEl;
        inspectedPage.trigger("selectElement", currentSelectedElement)
    })

    if (!isMobile()){
        $("*").mouseenter(function(e){
            if (!shouldHandle(e)) {return}
            e.stopPropagation()
            currentPreviewedElement = e.target
            inspectedPage.trigger("previewElement", e.target)
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
        $("#fromjs").css("width", "55vw")
        $("body").addClass("fromjsIsMobile")
    } else {
        $("body").css("padding-right", "40vw")
    }

}

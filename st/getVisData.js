import {disableTracing} from "../src/tracing/tracing"


import whereDoesCharComeFrom from "../src/whereDoesCharComeFrom"
import getRootOriginAtChar from "../src/getRootOriginAtChar"
import { OriginPath, FromJSView } from "../src/ui/ui"
var _ = require("underscore")
var $ = require("jquery")
import exportElementOrigin from "../src/export-element-origin"


var ReactDOM = require("react-dom")
var React = require("react")


setTimeout(function(){
    if (window.isVis) {
        return;
    }

    disableTracing()

    var link = document.createElement("link")
    link.setAttribute("rel", "stylesheet")
    link.setAttribute("href", "/fromjs-internals/fromjs.css")
    document.body.appendChild(link)

    var container = document.createElement("div")
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

    var selectionMarkerDiv = document.createElement("div")
    selectionMarkerDiv.setAttribute("style", "outline: 2px solid red; position: fixed;z-index: 10001;pointer-events: none")
    document.body.appendChild(selectionMarkerDiv)

    var hoverMarkerDiv = document.createElement("div")
    hoverMarkerDiv.setAttribute("style", "outline: 1px solid blue; position: fixed;z-index: 10000;pointer-events: none")
    document.body.appendChild(hoverMarkerDiv)

    $("*").off("click")
    $("*").click(function(e){
        if (!shouldHandle(e)) {return}
        e.stopPropagation();
        e.preventDefault();
        component.display(this)

        var rect = this.getBoundingClientRect();
        $(selectionMarkerDiv).css({
            left: rect.left,
            top: rect.top,
            height: rect.height,
            width: rect.width
        })
    })
    $("*").mouseenter(function(e){
        if (!shouldHandle(e)) {return}
        e.stopPropagation()

        component.setPreviewEl(e.target)

        var rect = this.getBoundingClientRect();
        $(hoverMarkerDiv).css({
            left: rect.left,
            top: rect.top,
            height: rect.height,
            width: rect.width
        })
    })
    $("*").mouseleave(function(e){
        if (!shouldHandle(e)) {return}
        component.setPreviewEl(null)
    })



        console.log("k")


    return
}, 4000)

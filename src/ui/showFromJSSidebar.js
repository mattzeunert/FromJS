import $ from "jquery"
import React from "react"
import ReactDOM from "react-dom"
import isMobile from "../isMobile"
import whereDoesCharComeFrom from "../whereDoesCharComeFrom"
import getRootOriginAtChar from "../getRootOriginAtChar"
import { OriginPath, FromJSView } from "../ui/ui"
import {disableTracing, enableTracing} from "../tracing/tracing"

export default function showFromJSSidebar(){
    disableTracing()

    var windowJQuery = window.jQuery

    var link = document.createElement("link")
    link.setAttribute("rel", "stylesheet")
    link.setAttribute("href", "/fromjs-internals/fromjs.css")
    document.body.appendChild(link)


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

    if (windowJQuery) {
        windowJQuery("*").off()
    }

    $("*").click(function(e){
        if (!shouldHandle(e)) {return}
        e.stopPropagation();
        e.preventDefault();
        component.display(e.target)
    })

    if (!isMobile()){
        $("*").mouseenter(function(e){
            if (!shouldHandle(e)) {return}
            e.stopPropagation()
            component.setPreviewEl(e.target)
        })
        $("*").mouseleave(function(e){
            if (!shouldHandle(e)) {return}
            component.setPreviewEl(null)
        })
    }

    if (isMobile()){
        var style = document.createElement("style")
        style.innerHTML = "body {padding-right: 56vw !important; padding-left: 1vw !important}"
        style.innerHTML += "#fromjs { width: 55vw !important}"
        // for some reason doing $("#fromjs").css() duplicates the element
        // no, something else is doing that, prob could just use .css
        $("body").append(style)
        $("body").addClass("fromjsIsMobile")
    }

}

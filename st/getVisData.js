var async = require("../src/async");

import {disableTracing} from "./string-trace"


import whereDoesCharComeFrom from "../src/whereDoesCharComeFrom"
import getRootOriginAtChar from "../src/getRootOriginAtChar"
import { OriginPath } from "../src/ui/ui"
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


    var div = $("<div>")
    div.attr("id", "fromjs")
    div.className = "fromjs"

    var textContainer = $("<div>")
    div.append(textContainer)
    div.append("<hr>")

    var link = document.createElement("link")
    link.setAttribute("rel", "stylesheet")
    link.setAttribute("href", "/fromjs-internals/fromjs.css")
    document.body.appendChild(link)
    div.append("<div id='origin-path'></div>")

    console.log("k")

    function display(el){
        $("#origin-path").empty()

        var outerHTML = el.outerHTML;
        textContainer.html("");
        textContainer.addClass("fromjs-value")
        for (let index in outerHTML){
            let char = outerHTML[index]
            let span = $("<span>")
            span.html(char);
            textContainer.append(span)
            span.on("click", function(){
                showOriginPath(el, index)
            })
        }

        var autoIndex = el.outerHTML.indexOf(">") + 1
        autoIndex++; // because it happens to work better for todomvc
        console.log("autoselect index", autoIndex)
        showOriginPath(el, autoIndex)
    }

    $("*").off("click")
    $("*").click(function(e){
        if ($(this).parents("#fromjs").length !== 0){
            return
        }
        if ($(this).is("html, body")){
            return;
        }
        e.stopPropagation();e.preventDefault();
        display(this)
    })
    $("body").append(div)
}, 4000)


function showOriginPath(el, index){
    var characterIndex = parseFloat(index);
    var useful = getRootOriginAtChar(el, characterIndex);

    console.log("used origin", useful)
    console.log("has char", useful.origin.value[useful.characterIndex])

    displayOriginPath(useful.origin, useful.characterIndex)

    return

    function displayOriginPath(oooo, characterIndex){
        var originPath = whereDoesCharComeFrom(oooo, characterIndex)
        window.exportToVis = function(){
            exportElementOrigin(oooo)
        }

        ReactDOM.render(
            <div style={{padding: 10}}>
                <OriginPath
                    originPath={originPath}
                    handleValueSpanClick={(origin, characterIndex) => {
                        console.log("clicked on", characterIndex, origin)
                        displayOriginPath(origin, characterIndex)
                    }} />
            </div>,
            $("#origin-path")[0]
        )
    }
}

var async = require("./async");
var ErrorStackParser = require("./error-stack-parser")

import {disableTracing} from "./string-trace"

import OriginPathComponent, {whereDoesCharComeFrom} from "../vis/vis"
var _ = require("underscore")
var endsWith = require("ends-with")
var $ = require("jquery")
import exportElementOrigin from "./export-element-origin"

function isElement(value){
    return value instanceof Element
}

function resolveElOriginInputValue(inputValue, callback){
    if (isElement(inputValue)){
        getElementOriginData(inputValue, function(data){
            callback(null, data)
        })
    } else {
        callback(null, inputValue)
    }
}

function convertElOrigin(elOrigin, callback){
    elOrigin.value = elOrigin.getValue();

    var inputValues = elOrigin.inputValues.filter(function(origin){
        if (origin === undefined) {
            throw "hmm dont really want this to happen"
            return false;
        }
        return true;
    })

    async.map(inputValues, resolveElOriginInputValue,  function(err, resolvedInputValues){
        elOrigin = _.clone(elOrigin)
        elOrigin.inputValues = resolvedInputValues;
        callback(null, elOrigin)
    })
}
function getElementOriginData(el, callback){
    if (!el.__elOrigin){
        console.warn("no elorigin for", el)
        callback({action: "no el origin"});
        return;
    }

    var elOrigins = [];
    if (el.__elOrigin) {
        elOrigins = el.__elOrigin
    }
    async.map(elOrigins, convertElOrigin, function(err, convertedElOrigins){
        var data = {
            actionDetails: el.tagName,
            stack: undefined,
            action: "Element",
            value: el.outerHTML,
            inputValues: convertedElOrigins
        }
        callback(data)
    })
}

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

    div.append("<style>.fromjs-value span:hover {color: lime} .fromjs-value { background: #eee; padding: 10px}</style>")
    div.append("<div id='origin-path'></div>")

    div.css({
        position: "fixed",
        "font-family": "Arial",
        "font-size": 16,
        right: 0,
        top: 0,
        bottom: 0,
        height: "100vh",
        width: "40vw",
        background: "white",
        overflow: "auto",
        "border-top": "1px solid black"
    })

    $("body").css("padding-right", "40vw")


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
    console.log("all on click disable")
    $("*").click(function(e){
        if ($(this).parents(".fromjs").length !== 0){
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


function tagTypeHasClosingTag(tagName){
    return originalCreateElement.apply(document, [tagName]).outerHTML.indexOf("></") !== -1
}

function getElementWithUsefulOrigin(el, characterIndex){

    var tagHtml = el.outerHTML.replace(el.innerHTML,"")
    var openingTag = tagHtml.split("></")[0] + ">"
    var closingTag = "</" +tagHtml.split("></")[1]
    var innerHTML = el.innerHTML

    var vm = new ValueMap();
    vm.appendString(openingTag, "openingTag", 0)
    vm.appendString(innerHTML, "innerHTML", 0)
    vm.appendString(closingTag, "closingTag", 0)

    var item = vm.getItemAt(characterIndex)

    if (item.originObject === "openingTag") {
        var vm = new ValueMap();

        var openingTagStart = "<" + el.tagName
        vm.appendString(openingTagStart, el.__elOrigin.tagName, 0)

        for (var i = 0;i<el.attributes.length;i++) {
            var attr = el.attributes[i]


            var attrStr = " " + attr.name
            if (attr.textContent !== ""){
                attrStr += "='" + attr.textContent +  "'"
            }

            vm.appendString(attrStr, el.__elOrigin["attribute_" + attr.name], 0)
        }

        var openingTagEnd = ""
        if (!tagTypeHasClosingTag(el.tagName)) {
            openingTagEnd +=  "/"
        }
        openingTagEnd += ">"
        vm.appendString(openingTagEnd, el.__elOrigin.tagName, 0)

        var item = vm.getItemAt(characterIndex)
        return {
            origin: item.originObject,
            characterIndex: item.characterIndex + (item.originObject.inputValuesCharacterIndex ? item.originObject.inputValuesCharacterIndex[0] : 0)
        }
    } else if (item.originObject === "closingTag") {
        return {
            origin: el.__elOrigin.tagName,
            characterIndex: 0 // not one hundred perecent accurate, but maybe close enough
        }
    } else if (item.originObject === "innerHTML") {
        var vm = new ValueMap();
        characterIndex -= openingTag.length;
        el.__elOrigin.contents.forEach(function(el){
            var elIsTextNode = el.outerHTML === undefined
            if (elIsTextNode) {
                vm.appendString(el.textContent, el, 0)
            } else {
                vm.appendString(el.outerHTML, el, 0)
            }
        })
        var item = vm.getItemAt(characterIndex)
        var isTextNode = item.originObject.outerHTML === undefined;

        if (isTextNode) {
            var origin = item.originObject.__elOrigin.textValue
            debugger;
            return {
                characterIndex: item.characterIndex + (origin.inputValuesCharacterIndex ? origin.inputValuesCharacterIndex[0] : 0),
                origin: origin
            }
        }
        return getElementWithUsefulOrigin(item.originObject, item.characterIndex)
    } else {
        throw "ooooossdfa"
    }

    // while (usedEl.__elOrigin[0].action === "ancestor innerHTML"){
    //     var prevUsedEl = usedEl;
    //     usedEl = usedEl.parentElement
    //     var childNodes = usedEl.childNodes
    //     for (var i in childNodes) {
    //         var childNode = childNodes[i];
    //
    //         if (prevUsedEl === childNode) {
    //             break;
    //         } else {
    //             var isTextNode = childNode.outerHTML === undefined
    //             if (!isTextNode){
    //                 characterIndex += childNode.outerHTML.length;
    //             } else {
    //                 characterIndex += childNode.textContent.length;
    //             }
    //         }
    //     }
    //
    //     var outerHTMLAdjustment = usedEl.outerHTML.replace(usedEl.innerHTML, "").indexOf("</")
    //     characterIndex += outerHTMLAdjustment
    // }

    return {
        origin: origin,
        characterIndex: characterIndex
    }
}

function showOriginPath(el, index){
    var characterIndex = parseFloat(index);
    var useful = getElementWithUsefulOrigin(el, characterIndex);

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
                <OriginPathComponent
                    originPath={originPath}
                    handleValueSpanClick={(origin, characterIndex) => {
                        console.log("clicked on", characterIndex, origin)
                        displayOriginPath(origin, characterIndex)
                    }} />
            </div>,
            $("#origin-path")[0]
        )
    }



    getElementOriginData(usedEl, function(oooo){

        window.oooo = oooo;
        console.log("oooo", oooo)


        displayOriginPath(oooo, characterIndex)


    })
}

window.getElementOriginData = getElementOriginData

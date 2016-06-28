var async = require("./async");
var ErrorStackParser = require("./error-stack-parser")

import OriginPathComponent, {whereDoesCharComeFrom} from "../vis/vis"
var _ = require("underscore")
var endsWith = require("ends-with")
var $ = require("jquery")

var resolveFrame = require("./resolve-frame")

var gps;


function resolveStackArray(stackArray, callback){


    var allCodeIsPartOfStringTrace = stackArray.length === 0;
    if (allCodeIsPartOfStringTrace){
        callback(null, [])
        return;
    }

    var str = stackArray.join("\n")

    var err = ErrorStackParser.parse({stack: str});


    async.map(err, resolveFrame, function(err, newStackFrames){
        callback(newStackFrames)
    })
}
//
function resolveStacksInOrigin(origin, callback){
    var functionsToCall = []
    if (origin.stack){
        functionsToCall.push(function(callback){
            resolveStackArray(origin.stack, function(newStack){
                origin.resolvedStack = newStack
                callback()
            })
        })
    }
    if (origin.inputValues) {
        functionsToCall.push(function(callback){
            async.each(origin.inputValues, function(iv, callback){
                if (!iv) {callback();}
                else {
                    resolveStacksInOrigin(iv, callback)
                }
            }, function(){
                callback();
            })
        })
    }


    async.series(functionsToCall, function(){
        callback();
    })

}

function isElement(value){
    return value instanceof Element
}

function resolveStackIfAvailable(data, callback){
    if (data.stack){
        resolveStackArray(data.stack, function(resolvedStack){
            data = _.clone(data);
            data.resolvedStack = resolvedStack;
            callback(null, data)
        })
    } else {
       callback(null, data)
    }
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


    window.JSON.parse = window.nativeJSONParse





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
        bottom: 0,
        left: 0,
        width: "100%",
        "max-height": "500px",
        background: "white",
        overflow: "auto",
        "border-top": "1px solid black"
    })


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
                var characterIndex = parseFloat(index);
                var usedEl = el;

                console.log("clicked on", usedEl.outerHTML[characterIndex], characterIndex)
                while (usedEl.__elOrigin[0].action === "ancestor innerHTML"){
                    var prevUsedEl = usedEl;
                    usedEl = usedEl.parentElement
                    var childNodes = usedEl.childNodes
                    for (var i in childNodes) {
                        var childNode = childNodes[i];

                        if (prevUsedEl === childNode) {
                            break;
                        } else {
                            var isTextNode = childNode.outerHTML === undefined
                            if (!isTextNode){
                                characterIndex += childNode.outerHTML.length;
                            } else {
                                characterIndex += childNode.textContent.length;
                            }
                        }
                    }

                    var outerHTMLAdjustment = usedEl.outerHTML.replace(usedEl.innerHTML, "").indexOf("</")
                    characterIndex += outerHTMLAdjustment

                    console.log("char is now", usedEl.outerHTML[characterIndex], characterIndex)
                }

                console.log("clicked el", el)
                console.log("used el", usedEl)

                getElementOriginData(usedEl, function(oooo){
                    window.oooo = oooo;
                    console.log("oooo", oooo)

                    // exportElementOrigin(oooo)
                    displayOriginPath(oooo, characterIndex)

                    function displayOriginPath(oooo, characterIndex){
                        var originPath = whereDoesCharComeFrom(oooo, characterIndex)

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


                })
            })
        }
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
}, 1000)

window.getElementOriginData = getElementOriginData

function exportElementOrigin(origin){
    console.time("Resolving all origin stacks")
    resolveStacksInOrigin(origin, function(){
        console.timeEnd("Resolving all origin stacks")
        localStorage.setItem("visData", JSON.stringify(origin))
    })

}

var async = require("./async");
var ErrorStackParser = require("./error-stack-parser")
var StackTraceGPS = require("./stacktrace-gps")
var vis = require("../vis/vis")
var _ = require("underscore")
var endsWith = require("ends-with")
var $ = require("jquery")

var gps;

function resolveStackArray(stackArray, callback){
    var unfilteredStackArray = stackArray
    stackArray = stackArray.filter(function(frame){
        if (frame.indexOf("string-trace.js") !== -1) {
            return false;
        }
        if (frame.indexOf("(native)") !== -1) {
            return false;
        }
        if (frame === "Error"){
            return false;
        }
        return true
    })

    var allCodeIsPartOfStringTrace = stackArray.length === 0;
    if (allCodeIsPartOfStringTrace){
        callback(null, unfilteredStackArray)
        return;
    }

    var str = stackArray.join("\n")

    var err = ErrorStackParser.parse({stack: str});



    function resFrame(frame, callback){
        gps._get(frame.fileName).then(function(src){
            var lines = src.split("\n")
            frame.prevLine = lines[frame.lineNumber - 1 - 1]// adjust for lines being one-indexed
            frame.nextLine = lines[frame.lineNumber + 1 - 1]
            frame.line = lines[frame.lineNumber - 1];

            callback(null, JSON.parse(JSON.stringify(frame)))
        })

    }

    async.map(err, function(frame, callback){
        if (endsWith(frame.fileName, ".html")){
            // don't bother looking for source map file
            callback(null, frame)
        } else {
            gps.pinpoint(frame).then(function(newFrame){
                resFrame(newFrame, callback)
            }, function(){
                resFrame(frame, callback)
                console.log("error", arguments)
            });
        }
    }, function(err, newStackFrames){
        callback(newStackFrames)
    })
}

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
        var origin = _.clone(inputValue);

        resolveStacksInOrigin(origin, function(){
            callback(null, origin)
        })
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

        resolveStackIfAvailable(elOrigin, function(err, elOrigin){
            callback(null, elOrigin)
        })
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
        resolveStackIfAvailable(data, function(err, data){
            callback(data)
        })
    })
}

setTimeout(function(){
    var sourceCache = {};
    var fnEls = document.getElementsByClassName("string-trace-fn")
    fnEls = Array.prototype.slice.call(fnEls)
    fnEls.forEach(function(el){
        var key = el.getAttribute("fn") + ".js"
        sourceCache[key] = el.innerHTML
        sourceCache[key + "?dontprocess=yes"] = decodeURIComponent(el.getAttribute("original-source"))
        sourceCache[el.getAttribute("sm-filename")] = decodeURIComponent(el.getAttribute("sm"))
    })

    gps = new StackTraceGPS({sourceCache: sourceCache});

    window.JSON.parse = window.nativeJSONParse





    var div = $("<div>")
    div.attr("id", "fromjs")
    div.append("<style>#fromjs span:hover{color: red}</style>")
    div.append("<div id='origin-path'></div>")
    var textContainer = $("<div>")
    div.append(textContainer)
    div.css({
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        "max-height": "200px",
        background: "#ddd",
        overflow: "auto"
    })

    $("body").css("margin-top", "200px")

    console.log("k")

    function display(el){
        var outerHTML = el.outerHTML;
        textContainer.html("");
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
                    console.log("oooo", oooo)

                    var originPath = vis.whereDoesCharComeFrom(oooo, characterIndex)
                    vis.showOriginPath(originPath)
                    console.log(originPath)
                })


            })
        }
    }

    $("*").off("click")
    $("*").click(function(e){
        e.stopPropagation();e.preventDefault();
        if ($(this).is("html, body")){
            return;
        }
        display(this)
    })
    $("body").append(div)





    // console.time("Get visData")
    // getElementOriginData(document.body, function(oooo){
    //
    //     window.oooo = oooo;
    //     console.timeEnd("Get visData")
    //     localStorage.setItem("visData", JSON.stringify(oooo))
    //     gps = null;
    //     console.log("got oooo, saved to localstorage")
    // })
}, 2000)

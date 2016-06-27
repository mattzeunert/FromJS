if (typeof require !== "undefined"){
    window.ValueMap = require("../value-map")
}

function showOriginPath(originPath){
    window.op = originPath
    console.log("originPath", originPath)
    var originPathEl =  document.createElement("div")

    var lastOrigin = originPath[originPath.length - 1]
    originPathEl.innerHTML += getOriginPathItemHtml(lastOrigin)
    originPathEl.innerHTML += "<br/><hr/>"


    for (origin of originPath) {
        originPathEl.innerHTML += getOriginPathItemHtml(origin)
    }

    document.getElementById("origin-path").innerHTML = ""
    document.getElementById("origin-path").appendChild(originPathEl)
}

function getOriginPathItemHtml(origin){
    var itemHtml = "";
    itemHtml += "<div>"

        itemHtml += "<u>"

        itemHtml += origin.originObject.action

        itemHtml += "</u>"

        if (origin.originObject.resolvedStack) {
            itemHtml += " (" + _.first(origin.originObject.resolvedStack).fileName.replace("?dontprocess=yes", "") + ")"
        }

        itemHtml += "<br/>"


        if (!origin.originObject.resolvedStack) {
            itemHtml += "(no stack)"
        } else {
            itemHtml += "<code>"
            var frame = _.first(origin.originObject.resolvedStack)
            itemHtml += escapeAngleBrackets(frame.line.substr(0, frame.columnNumber)) +
                "<span style='color: red; '>|</span>" +
                escapeAngleBrackets(frame.line.substr(frame.columnNumber));
            itemHtml += "</code>"
        }



        var val = origin.originObject.value
        itemHtml += "<div>" + escapeAngleBrackets(val.substr(0, origin.characterIndex)) +
                "<span style='color: red; font-weight:bold'>" +
                escapeAngleBrackets(val.substr(origin.characterIndex, 1))
                + "</span>" +
                escapeAngleBrackets(val.substr(origin.characterIndex + 1)) + "</div>"


    itemHtml += "</div>"

    return itemHtml
}

function nodeIsHTMLElement(node){
    return node.action === "initial html" || node.action === "content from initial html" ||
        node.action === "createElement" || node.action === "assign innerHTML" ||
        node.action === "appendChild"
}

function nodeIsValueSource(node){
    return node.action === "string literal" || node.action === "localStorage.getItem"
}

function showInfo(info){
    document.getElementById("info").innerHTML = ""

    var html = "<u>" + info.action + " </u><br/>"
    var header = document.createElement("div")
    header.innerHTML = html;
    document.getElementById("info").appendChild(header)
    html = ""

    var value = info.value;
    if (value === undefined) {
        value = "(no value available)"
    }
    if (value === "") {
        value = "(empty string)"
    }

    var valueBlockQuote = document.createElement("blockquote")
    valueBlockQuote.classList.add("value-blockquote")
    for (let index in value){
        var char = value[index]
        var a = document.createElement("a")
        a.innerHTML = escapeAngleBrackets(char)
        a.onclick = function(){
            nodes = []
            links = []
            processOriginObject(info)

            var charOrigin = whereDoesCharComeFrom(info, index)
            showOriginPath(charOrigin)
            charOrigin.forEach(function(o){
                if (!o.originObject)return
                o.originObject.isInCurrentPath = true;
            })


            showGraph()
        }
        valueBlockQuote.appendChild(a)
    }
    document.getElementById("info").appendChild(valueBlockQuote)


    var hasHighlighted = false
    if (info.resolvedStack) {
        info.resolvedStack.forEach(function(frame){
            var fileNameParts = frame.fileName.split("/")
            var fileName = fileNameParts[fileNameParts.length - 1]
            var fileName = fileName.replace("?dontprocess=yes","")

            var isLibrary = fileName.indexOf("underscore") !== -1 || fileName.indexOf("jquery") !== -1

            var isLibraryClass = isLibrary ? "stack-frame--library" : ""

            var highlightClass = "";
            if (!hasHighlighted) {
                if (!isLibrary){
                    highlightClass = "stack-frame--highlight"
                    hasHighlighted = true
                }

            }

            var line = "";

            if (frame.line){
                line = escapeAngleBrackets(frame.line.substr(0, frame.columnNumber)) +
                    "<span style='color: red; '>|</span>" +
                    escapeAngleBrackets(frame.line.substr(frame.columnNumber));
            }


            html += `<div class="stack-frame ${highlightClass} ${isLibraryClass}">
                <div class="stack-frame__file-and-function">
                    ${fileName}:${frame.lineNumber} / ${frame.functionName}
                </div>
                <div class="stack-frame__source ">
                    ${line}
                </div>
            </div>`;
        })
    }
    var stacktrace = document.createElement("div")
    stacktrace.innerHTML = html;
    document.getElementById("info").appendChild(stacktrace)
}

function escapeAngleBrackets(str){
    return str.replace(/\</g, "&lt;").replace(/\>/g, "&gt;")
}



var nodes= [];
var links = [];

function whereDoesCharComeFrom(originObject, characterIndex){
    characterIndex = parseFloat(characterIndex)

    var steps = [];
    var step = {
        originObject: originObject,
        characterIndex: characterIndex
    }
    steps.push(step)
    while (step !== null){
        step = goUp(step)
        if (step !== null){
            steps.push(step)
        }
    }

    return steps
}

if (typeof module !== "undefined"){
    module.exports = {
        whereDoesCharComeFrom: whereDoesCharComeFrom,
        showOriginPath: showOriginPath
    }
}

function goUp(step){

    var ret
    if (step.originObject.action === "set className"){
        var characterIndex =  step.characterIndex
        ret = {
            originObject: step.originObject.inputValues[0],
            characterIndex: characterIndex
        }
    } else if (step.originObject.inputValues.length === 1 && step.originObject.inputValues[0].value === step.originObject.value) {
        ret = {
            originObject: step.originObject.inputValues[0],
            characterIndex: step.characterIndex
        }
    } else  if (step.originObject.action === "concat") {
        var valueMap = new ValueMap()
        valueMap.append(step.originObject.inputValues[0])
        valueMap.append(step.originObject.inputValues[1])

        ret = valueMap.getItemAt(step.characterIndex)
    } else if (step.originObject.action === "Element") {
        var valueMap = new ValueMap();
        var createElement;

        var tagOrigins = [];
        var contentOrigins = []
        step.originObject.inputValues.forEach(function(inputValue){
            if (inputValue.action === "createElement" || inputValue.action === "set className" ||
                inputValue.action === "setAttribute"){
                tagOrigins.push(inputValue)
            } else {
                contentOrigins.push(inputValue)
            }
        })


        tagOrigins.forEach(function(tagOrigin){
            if (tagOrigin.action === "createElement") {
                valueMap.appendString("<" + tagOrigin.inputValues[0].value , tagOrigin, 0)
            } else if (tagOrigin.action === "set className"){
                valueMap.appendString(" class='" + tagOrigin.value + "'", tagOrigin, 0)
            } else if (tagOrigin.action === "setAttribute") {
                valueMap.appendString(" " + tagOrigin.inputValues[0].value + '="' + tagOrigin.inputValues[1].value + '"', tagOrigin, 0)
            } else {
                debugger
            }
        })
        tagOrigins.forEach(function(tagOrigin){
            if (tagOrigin.action === "createElement") {
                var contentBefore = "<" + tagOrigin.inputValues[0].value
                valueMap.appendString(">" , tagOrigin, contentBefore.length)
            }
        })
        contentOrigins.forEach(function(inputValue){
            if (inputValue.action === "createElement") {
                return;
            }
            else if (inputValue.action === "appendChild"){
                valueMap.append(inputValue)
            }
            else if (inputValue.action === "assign innerHTML"){
                valueMap.append(inputValue)
            }
            else {
                throw "unhandled input value in elment item"
            }
        })
        tagOrigins.forEach(function(tagOrigin){
            if (tagOrigin.action === "createElement") {
                valueMap.appendString("</" + tagOrigin.inputValues[0].value + ">", tagOrigin, 0)
            }
        })

        if (valueMap.debugginGetValue() !== step.originObject.value){
            console.warn(valueMap.debugginGetValue(), "!!!!is not!!!", step.originObject.value)
        }

        ret = valueMap.getItemAt(step.characterIndex)
    } else if (step.originObject.action === "createElement") {
        var characterIndex = step.characterIndex
        var elementType = step.originObject.inputValues[0].value;
        var openingHtml = "<" + elementType + ">"
        var closingHtml = "<" + elementType + "/>"
        // step.originObject.value is something like '<li></li>', but we need a char index for just 'li'
        if (characterIndex >= openingHtml.length) {
            characterIndex -= openingHtml.length;
            characterIndex -= "/".length;
        }
        characterIndex -= "<".length

        if (characterIndex<0){
            // they clicked on either a < or an /
            // it's not really clear what that should mean, since that doesn't have an origin
            // but let's pretend for now
            characterIndex = 0
        }
        if (characterIndex == step.originObject.inputValues[0].value.length) {
            // they clicked on ">", should really end path here
            characterIndex = step.originObject.inputValues[0].value.length - 1
        }
        ret = {
            originObject: step.originObject.inputValues[0],
            characterIndex: characterIndex
        }
    } else if (step.originObject.action === "replace call") {
        // var valueBeforeReplace= step.originObject.inputValues[0].value
        // var replaceCallDidntChangeValue =valueBeforeReplace === step.originObject.value
        // if (replaceCallDidntChangeValue){
        //     return {
        //         originObject: step.originObject.inputValues[0],
        //         characterIndex: step.characterIndex
        //     }
        // }
        // throw "need to handle this"
        var valueMap = ValueMap.deserialize(step.originObject.valueItems, step.originObject.inputValues)
        ret = valueMap.getItemAt(step.characterIndex)
    }
    else if (step.originObject.action === "JSON.parse"){
        if (step.originObject.inputValues.length === 1) {
            ret = {
                originObject: step.originObject.inputValues[0],
                characterIndex: 0
            }
        } else {
            throw "need to handlesss"
        }
    }
    else {
        return null
        console.log("not handling step", step)
    }




    if (ret.originObject.action === "set className") {
        ret.characterIndex = ret.characterIndex - " class='".length
        if (ret.characterIndex < 0) {
            ret.characterIndex = 0;
            console.log("todo: really this means that this is the end of the path")
        }
    }



    return ret;
}



// processOriginObject(window.visOriginData)
processOriginObject(JSON.parse(localStorage.getItem("visData")))
function processOriginObject(origin){
    var index = nodes.length;
    origin.index = index;

    origin.isInCurrentPath = false
    nodes.push(origin)

    if (origin.inputValues) {
        origin.inputValues.forEach(function(inputValue){
            if (inputValue===null){return}
            var inputIndex = processOriginObject(inputValue)
            links.push({
                source: index,
                target: inputIndex,
                value: 20
            })
        })
    }
    if (origin.children){
        origin.children.forEach(function(child){
            var childIndex = processOriginObject(child)
            links.push({
                source: index,
                target: childIndex,
                value: 20
            })
        })
    }

    return index;
}



function showGraph(){


    var force = d3.layout.force()
        .charge(-200)
        .linkDistance(40)

        document.querySelector("#graph").innerHTML = ""
    var svg = d3.select("#graph").append("svg")


    function updateSize(){
        force.size([document.body.clientWidth, document.body.clientHeight - 150])
        svg
            .attr("width", document.body.clientWidth)
            .attr("height", document.body.clientHeight - 150);
    }

    updateSize()

    var graph = {
        nodes: nodes,
        links: links
    }

      force
          .nodes(graph.nodes)
          .links(graph.links)
          .start();

      var link = svg.selectAll(".link")
          .data(graph.links)
        .enter().append("line")
          .attr("class", "link")
          .style("stroke-width", function(d) { return Math.sqrt(d.value); });

      var node = svg.selectAll(".node")
          .data(graph.nodes)
        .enter()
        .append("g")

        node.append("circle")
          .attr("class", "node")
          .attr("r", 5)
          .call(force.drag)

          node.append("text")
            .style("font-size", 12)
            .text(function(d) {
                var text = d.action + (d.actionDetails ? " " + d.actionDetails : "");
                if (d.action === "string literal"){
                    text = '"' + d.value + '"'
                }

                text = text.replace(/\n/g, "\\n")

                if (text.length > 25) {
                    text = text.substr(0, 25) + "..."
                }

                return text;
            })
            .on("mouseenter", function(d){
                var currentSelection = document.querySelector(".selected")
                window.lastHover = d
                if (currentSelection) {
                    currentSelection.classList.remove("selected")
                }

                this.classList.add("selected")

                showInfo(d);
                console.log(d)
            })
            .on("click", function(d){
                nodes = []
                links = []
                processOriginObject(d)
                document.querySelector("svg").remove()
                showGraph()

            })


      force.on("tick", function() {
        link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });


        node.selectAll("circle")
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; })
            .attr("fill", function(d){
                if (d.isInCurrentPath) {
                    return "lime"
                }
                if (d.index === 0) {
                    return "red"
                }
                if (nodeIsHTMLElement(d)){
                    return "blue"
                }
                if (nodeIsValueSource(d)){
                    return "orange"
                }
                return "black"
            })


        node.selectAll("text")
            .attr("transform", function(d){
                var x = d.x;
                var y=  d.y;
                return "translate(" + x + "," + y + ")"
            })
      });

      window.onresize = _.throttle(function(){
          updateSize();
          force.start();
      }, 500);
  }

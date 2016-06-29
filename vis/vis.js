import whereDoesCharComeFrom from "../src/whereDoesCharComeFrom"

window._ = require("underscore")
import {disableTracing} from "../src/tracing/tracing"
import {StringTraceString} from "../src/tracing/FromJSString"

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
            // showOriginPath(charOrigin)
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




// processOriginObject(window.visOriginData)

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

window.showGraph = showGraph

window.init = init
function init(){
    disableTracing();
    processOriginObject(JSON.parse(localStorage.getItem("visData")))
    showGraph()
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

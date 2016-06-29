import React from "react"
import resolveFrame from "../st/resolve-frame"
window.ValueMap = require("../value-map")
window._ = require("underscore")
import {disableTracing} from "../st/string-trace"

export default class OriginPath extends React.Component {
    render(){
        var lastOrigin = this.props.originPath[this.props.originPath.length - 1]

        var fullPath = [];
        for (var originPathItem of this.props.originPath) {
            fullPath.push(<OriginPathItem
                originPathItem={originPathItem}
                handleValueSpanClick={this.props.handleValueSpanClick}
            />)
        }
        return <div>
            <OriginPathItem
                key={JSON.stringify(lastOrigin)}
                originPathItem={lastOrigin}
                handleValueSpanClick={this.props.handleValueSpanClick}
            />
            <hr/>
            {fullPath}
        </div>
    }
}

class OriginPathItem extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            resolvedFrame: null
        }

        var frame = _.first(this.props.originPathItem.originObject.stack)
        if (frame){
            resolveFrame(frame, (err, resolvedFrame) => {
                this.setState({resolvedFrame})
            })
        }
    }
    render(){
        var originObject = this.props.originPathItem.originObject


        var filename = "";
        if (this.state.resolvedFrame) {
            filename = this.state.resolvedFrame.fileName.replace("?dontprocess=yes", "");
            var filenameParts = filename.split("/")
            filename = _.last(filenameParts)
        }

        return <div style={{paddingBottom: 20}}>
            <div style={{paddingBottom: 5}}>
                <span style={{textDecoration: "underline", fontWeight: "bold"}}>
                    {originObject.action}
                </span>
                ({filename})
            </div>

            <ValueEl originPathItem={this.props.originPathItem} handleValueSpanClick={this.props.handleValueSpanClick} />

            <Stack originPathItem={this.props.originPathItem} />
        </div>
    }
}

class ValueEl extends React.Component {
    render(){
        var self = this;
        function getValueSpans(val, indexOffset){

            var els = [];
            for (let index in val){
                index = parseFloat(index)
                var char = val[index]
                var span = <span
                    onClick={() => {
                        self.props.handleValueSpanClick(origin.originObject, index + indexOffset)
                    }}
                >
                    {char}
                </span>
                els.push(span)
            }
            return els
        }

        var origin = this.props.originPathItem;
        var val = origin.originObject.value

        var valBeforeColumn = val.substr(0, origin.characterIndex);
        var valAtColumn = val.substr(origin.characterIndex, 1);
        var valAfterColumn = val.substr(origin.characterIndex + 1)

        return <div className="fromjs-value">
            {getValueSpans(valBeforeColumn, 0)}
            <span style={{color: "red", fontWeight: "bold"}}>
                <pre style={{display: "inline"}}>{valAtColumn}</pre>
            </span>
            {getValueSpans(valAfterColumn, valBeforeColumn.length + valAtColumn.length)}
        </div>
    }
}

class Stack extends React.Component {
    render(){
        var originPathItem = this.props.originPathItem;
        if (!originPathItem.originObject.stack) {
            return <div>(No stack)</div>
        }

        if (originPathItem.originObject.stack.length === 0) {
            return <div>(Empty stack)</div>
        }

        var frame = _.first(originPathItem.originObject.stack)

        return <div>
            <StackFrame frame={frame} key={frame} />
        </div>
    }
}

class StackFrame extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            resolvedFrame: null
        }
        resolveFrame(props.frame, (err, resolvedFrame) => {
            this.setState({resolvedFrame})
        })
    }
    render(){
        function processFrameString(str){
            return str.replace(/ /g, '\xa0') //nbsp
        }

        if (this.state.resolvedFrame === null) {
            return <div>Loading...</div>
        }

        var frame = this.state.resolvedFrame;


        return <code style={{
            background: "aliceblue",
            display: "block",
            paddingTop: 5,
            marginTop: 5,
            paddingBottom: 5
        }}>
            {processFrameString(frame.prevLine)}<br/>
            {processFrameString(frame.line.substr(0, frame.columnNumber))}
            <span style={{color: "red"}}>|</span>
            {processFrameString(frame.line.substr(frame.columnNumber))}
            <br/>
            {processFrameString(frame.nextLine)}
        </code>
    }
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

function whereDoesCharComeFrom(originObject, characterIndex){
    console.groupCollapsed("whereDoesCharComeFrom")
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

    console.groupEnd("whereDoesCharComeFrom")

    return steps
}

export {whereDoesCharComeFrom}

function goUp(step){
    console.log("trying to handle step with action", step.originObject.action)

    var ret
    if (step.originObject.action === "set className"){
        var characterIndex =  step.characterIndex
        var newCharIndex = characterIndex - " class='".length

        var clickedOnAttributeLeftPart = newCharIndex < 0
        var clickedOnAttributeRightPart = newCharIndex >= step.originObject.inputValues[0].value.length

        if (clickedOnAttributeLeftPart || clickedOnAttributeRightPart) {
            return null; // clicked on class=' part rather than actual class name
        }
        ret = {
            originObject: step.originObject.inputValues[0],
            characterIndex: newCharIndex
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
                inputValue.action === "setAttribute" ||
                inputValue.action === "initial html tag"){
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
            else if (inputValue.action === "initial html content"){
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
    else if (step.originObject.action === "match call"){
        if (step.originObject.value === step.originObject.inputValues[0].value) {
            ret = {
                originObject: step.originObject.inputValues[0],
                characterIndex: step.characterIndex
            }
        } else {
            throw "not handled mathc call"
        }
    }
    else {
        console.log("not handling step", step)
        return null
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

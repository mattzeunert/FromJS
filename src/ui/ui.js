import React from "react"
import _ from "underscore"
import resolveFrame from "../resolve-frame"
import getRootOriginAtChar from "../getRootOriginAtChar"
import whereDoesCharComeFrom from "../whereDoesCharComeFrom"
import getCodeFilePath from "./getCodeFilePath"
import fileIsDynamicCode from "../fileIsDynamicCode"
import isMobile from "../isMobile"
import config from "../config"
import ReactTooltip from "react-tooltip"
import "react-fastclick" // import for side effects, no export
import adjustColumnForEscapeSequences from "../adjustColumnForEscapeSequences"
import getDefaultInspectedCharacterIndex from "./getDefaultInspectedCharacterIndex"
import InspectedPage from "./InspectedPage"

import Perf from "react-addons-perf"
window.Perf = Perf



// ReactTooltip doesn't respond to UI changes automatically
setInterval(function(){
    ReactTooltip.rebuild()
}, 100)

function getFilenameFromPath(path){
    var pathParts = path.split("/");
    var filename = _.last(pathParts);
    filename = filename.replace(".dontprocess", "");
    return filename
}

function catchExceptions(fnToRun, onError){
    if (config.catchUIErrors) {
        try {
            fnToRun()
        } catch (err) {
            onError(err)
        }
    } else {
        fnToRun();
    }
}

function truncate(str, maxLength){
    if (str.length <= maxLength) {
        return str
    }
    return str.substr(0, 40) + "..."
}

export class OriginPath extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            showFullPath: false,
            originPath: null,
            isGettingOriginPath: false
        }
    }
    componentDidMount(){
        this.makeSureIsGettingOriginPath()
    }
    componentWillUnmount(){
        if (this.cancelGetOriginPath) {
            this.cancelGetOriginPath()
        }
    }
    componentDidUpdate(){
        this.makeSureIsGettingOriginPath()
    }
    makeSureIsGettingOriginPath(){
        if (this.state.isGettingOriginPath) {
            return;
        }
        this.setState({isGettingOriginPath: true})
        this.cancelGetOriginPath = this.props.getOriginPath((originPath) => {
            this.setState({
                originPath,
                isGettingOriginPath: true
            })
        })
    }
    render(){
        if (!this.state.originPath) {
            return <div>Getting origin path</div>
        }

        var originPath = this.state.originPath;
        originPath = originPath.filter(function(pathItem){
            // This is really an implementation detail and doesn't add any value to the user
            // Ideally I'd clean up the code to not generate that action at all,
            // but for now just filtering it out
            if (pathItem.originObject.action === "Initial Body HTML") {
                return false;
            }
            return true;
        })
        window.originPath = originPath

        var lastOriginPathStep = _.last(originPath)
        var firstOriginPathStep = _.first(originPath)

        var inbetweenSteps = originPath.slice(1, originPath.length - 1).reverse();
        var inbetweenStepsComponents = []
        if (this.state.showFullPath){
            for (var originPathStep of inbetweenSteps) {
                inbetweenStepsComponents.push(this.getOriginPathItem(originPathStep))
            }
        }

        var lastStep = this.getOriginPathItem(lastOriginPathStep);
        var firstStep = null;
        if (originPath.length > 1) {
            firstStep = this.getOriginPathItem(firstOriginPathStep)
        }

        var showFullPathButton = null;
        if (!this.state.showFullPath && originPath.length > 2){
            showFullPathButton = <div style={{marginBottom: 20}}>
                <button
                    className="fromjs-btn-link"
                    ref="showFullPathButton"
                    onClick={() => {
                        this.refs.showFullPathButton.textContent = "Rendering additional steps may take a few seconds."
                        setTimeout(() => {
                            this.setState({showFullPath: true})
                        }, 10)
                    }}>
                    =&gt; Show {inbetweenSteps.length} steps in-between
                </button>
            </div>
        }

        return <div>
            {lastStep}
            {showFullPathButton}

            {inbetweenStepsComponents}

            {firstStep}
        </div>
    }
    getOriginPathItem(originPathStep){
        return <OriginPathItem
            key={JSON.stringify({
                originId: originPathStep.originObject.id,
                characterIndex: originPathStep.characterIndex
            })}
            originPathItem={originPathStep}
            handleValueSpanClick={this.props.handleValueSpanClick}
        />
    }
}

class OriginPathItem extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            selectedFrameString: null,
            resolvedFrame: null,
            codeFilePath: null,
            showDetailsDropdown: false,
            previewFrameString: null
        }
    }
    componentDidMount(){
        var originObject = this.props.originPathItem.originObject
        if (originObject.isHTMLFileContent) {
            this.selectFrameString(getFrameFromHTMLFileContentOriginPathItem(this.props.originPathItem))
        } else {
            if (!originObject.getStackFrames) {
                return
            }
            this.selectFrameString(_.first(originObject.getStackFrames()))
        }
        this.makeSureIsResolvingFrame();
    }
    componentDidUpdate(){
        this.makeSureIsResolvingFrame();
    }
    makeSureIsResolvingFrame(){
        var frame = this.state.selectedFrameString
        if (frame && !this.state.resolvedFrame){
            if (this.cancelFrameResolution) {
                this.cancelFrameResolution()
            }
            this.cancelFrameResolution = resolveFrame(frame, (err, resolvedFrame) => {
                this.setState({resolvedFrame})

                this.cancelGetCodeFilePath = getCodeFilePath(resolvedFrame.fileName, (codeFilePath) => {
                    this.setState({codeFilePath})
                })
            })
        }
    }
    componentWillUnmount(){
        if (this.cancelFrameResolution){
            this.cancelFrameResolution()
        }
        if (this.cancelGetCodeFilePath){
            this.cancelGetCodeFilePath()
        }
    }
    render(){
        var originObject = this.props.originPathItem.originObject

        var filenameLink = null
        var viewSourceOriginButton = null;
        if (this.state.resolvedFrame) {
            var filename = this.state.resolvedFrame.fileName;
            var originalFilename = filename.replace(".dontprocess", "");
            var filenameParts = originalFilename.split("/")
            var uiFilename  = _.last(filenameParts)

            filenameLink = <a
                className="origin-path-step__filename"
                href={this.state.codeFilePath}
                target="_blank"
            >
                {uiFilename}
            </a>
        }
        if (this.state.resolvedFrame && fileIsDynamicCode(this.state.resolvedFrame.fileName)){
            viewSourceOriginButton = <button
                className="fromjs-btn-link fromjs-origin-path-step__only-show-on-step-hover"
                onClick={
                    () => this.props.handleValueSpanClick(fromJSDynamicFileOrigins[this.state.resolvedFrame.fileName], 0)
                }>
                Show Source Origin
            </button>
        }

        var stack = null;
        var originPathItem = this.props.originPathItem;
        var previewStack = null;
        if (this.state.previewFrameString){
            previewStack = <StackFrame
                frame={this.state.previewFrameString}
                key={this.state.previewFrameString}
                originPathItem={originPathItem} />
        }
        else if (this.state.selectedFrameString) {
            stack = <StackFrame
                frame={this.state.selectedFrameString}
                key={this.state.selectedFrameString}
                originPathItem={originPathItem}
            />
        } else {
            stack = <div style={{padding: 10}}>
                (Empty stack.)
            </div>
        }

        var stackFrameSelector = null;
        if (this.state.showDetailsDropdown){
            stackFrameSelector = <StackFrameSelector
                stack={originObject.getStackFrames()}
                selectedFrameString={this.state.selectedFrameString}
                onFrameSelected={(frameString) => {
                    this.selectFrameString(frameString)
                    this.setState({showDetailsDropdown: false})
                }}
                onFrameHovered={(frameString) => {
                    this.setState({previewFrameString: frameString})
                }}
            />
        }

        var inputValueLinks = null;
        if (this.state.showDetailsDropdown){
            var noParametersMessage = null;
            if (originObject.inputValues.length === 0){
                noParametersMessage = <div style={{color: "#777"}}>(No parameters.)</div>
            }
            inputValueLinks = <div style={{background: "aliceblue", paddingLeft: 10, paddingBottom: 10}}>
                <div>
                    <span data-multiline data-tip={
                        "These are the input values of the string transformation.<br>"
                        + "The parameters of a string concatenation would be the two strings being joined together.<br>"
                        + "A replace call would show the original string, the string being replaced, and the replacement string."
                        }>
                        Parameters
                        <span className="fromjs-info-icon">i</span>:
                    </span>
                </div>
                {noParametersMessage}
                {originObject.inputValues.map((iv) => {
                    return <div className="fromjs-input-value-link"
                        onClick={() => this.props.handleValueSpanClick(iv, 0)}>
                        &quot;{truncate(iv.value, 40)}&quot;
                    </div>
                })}
            </div>
        }

        var toggleFrameSelectorButton = null;
        if (originObject.getStackFrames && originObject.getStackFrames().length > 1) {
            toggleFrameSelectorButton = <button
                className="fromjs-origin-path-step__stack-frame-selector-toggle"
                onClick={() => this.setState({showDetailsDropdown: !this.state.showDetailsDropdown})}>
                {this.state.showDetailsDropdown ? "\u25B2" : "\u25BC"}
            </button>
        }

        var valueView = null;
        if (!config.alwaysShowValue && originObject.action === "Initial Page HTML") {
            valueView = <div></div>
        } else {
            valueView = <div style={{borderTop: "1px dotted #ddd"}} data-test-marker-step-value>
                <ValueEl
                    originPathItem={this.props.originPathItem}
                    handleValueSpanClick={this.props.handleValueSpanClick} />
                </div>
        }

        return <div className="fromjs-origin-path-step" style={{border: "1px solid #ddd", marginBottom: 20}}>
            <div >
                <div style={{background: "aliceblue"}}>
                    <span style={{
                        display: "inline-block",
                        padding: 5
                     }}>
                        <span style={{fontWeight: "bold", marginRight: 5}}
                            data-test-marker-step-action>
                            {originObject.action}
                        </span>
                        &nbsp;
                        <span>
                            {filenameLink}
                        </span>
                        &nbsp;{viewSourceOriginButton}


                    </span>
                    {toggleFrameSelectorButton}
                </div>

                {inputValueLinks}
                {stackFrameSelector}


                {stack}
                {previewStack}
            </div>

                {valueView}

        </div>
    }
    selectFrameString(frameString){
        this.setState({
            selectedFrameString: frameString,
            resolvedFrame: null,
            codeFilePath: null
        })
    }
}

class StackFrameSelector extends React.Component {
    render(){
        var self = this;
        return <div>
            {this.props.stack.map(function(frameString){
                return <StackFrameSelectorItem
                    isSelected={self.props.selectedFrameString === frameString}
                    onMouseEnter={() => self.props.onFrameHovered(frameString)}
                    onMouseLeave={() => self.props.onFrameHovered(null)}
                    frameString={frameString}
                    onClick={() => self.props.onFrameSelected(frameString)}
                />
            })}
        </div>
    }
}

class StackFrameSelectorItem extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            resolvedFrame: null
        }
    }
    componentDidMount(){
        this.cancelFrameResolution = resolveFrame(this.props.frameString, (err, resolvedFrame) => {
            this.setState({resolvedFrame})
        })
    }
    componentWillUnmount(){
        if (this.cancelFrameResolution){
            this.cancelFrameResolution()
        }
    }
    render(){
        var className = "fromjs-stack-frame-selector__item " ;
        if (this.props.isSelected) {
            className += "fromjs-stack-frame-selector__item--selected"
        }

        var loadingMessage = null;
        var frameInfo = null;

        var resolvedFrame = this.state.resolvedFrame;

        if (resolvedFrame) {
            var filename = getFilenameFromPath(resolvedFrame.fileName)
            var functionName = resolvedFrame.functionName;
            if (functionName === undefined) {
                functionName = "(anonymous function)"
            }
            frameInfo = <div>
                {functionName}
                <div style={{float: "right"}}>{filename}</div>
            </div>
        } else {
            loadingMessage = "Loading..."
        }

        return <div
            className={className}
            onClick={this.props.onClick}
            onMouseEnter={() => this.props.onMouseEnter()}
            onMouseLeave={() => this.props.onMouseLeave()}>
            {loadingMessage}
            {frameInfo}
        </div>
    }
}

function getFrameFromHTMLFileContentOriginPathItem(originPathItem){
    var originObject = originPathItem.originObject
    var valueBeforeChar = originObject.value.substr(0, originPathItem.characterIndex)

    var splitIntoLines = valueBeforeChar.split("\n")
    var line = splitIntoLines.length;
    var charIndex = _.last(splitIntoLines).length

    return "at initialHtml (" + originObject.isHTMLFileContent.filename + ":" + line + ":" + charIndex
}

class ValueEl extends React.Component {
    render(){
        var origin = this.props.originPathItem;
        var val = origin.originObject.value

        return <TextEl
            text={val}
            highlightedCharacterIndex={origin.characterIndex}
            onCharacterClick={(charIndex) => this.props.handleValueSpanClick(origin.originObject,  charIndex)}
        />
    }
}



class TextEl extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            truncateText: true
        }
    }
    shouldComponentUpdate(nextProps, nextState){
        // console.time("TextEl shouldUpdate")
        var shouldUpdate = JSON.stringify(nextProps) !== JSON.stringify(this.props) ||
            JSON.stringify(nextState) !== JSON.stringify(this.state)
        // console.timeEnd("TextEl shouldUpdate")
        return shouldUpdate
    }
    render(){
        var self = this;

        function splitLines(str){
            var lineStrings = str.split("\n")
            var lines = [];
            var charOffset = 0
            lineStrings.forEach(function(lineString, i){
                var isLastLine = i + 1 === lineStrings.length
                var text = lineString + (isLastLine ? "" : "\n");
                var charOffsetStart = charOffset
                var charOffsetEnd = charOffset + text.length;
                lines.push({
                    text: text,
                    lineNumber: i,
                    charOffsetStart: charOffsetStart,
                    charOffsetEnd: charOffsetEnd,
                    containsCharIndex: function(index){
                        return index >= charOffsetStart && index < charOffsetEnd
                    },
                    splitAtCharIndex: function(index){
                        var lineBeforeIndex = text.substr(0, highlightedCharIndex - charOffsetStart);
                        var lineAtIndex = text.substr(highlightedCharIndex - charOffsetStart, 1);
                        var lineAfterIndex = text.substr(highlightedCharIndex + 1 - charOffsetStart)
                        return [{
                            text: lineBeforeIndex,
                            charOffsetStart: charOffsetStart
                        }, {
                            text: lineAtIndex,
                            charOffsetStart: charOffsetStart + lineBeforeIndex.length
                        }, {
                            text: lineAfterIndex,
                            charOffsetStart: charOffsetStart + lineBeforeIndex.length + lineAtIndex.length
                        }]
                    }
                })
                charOffset = charOffsetEnd
            })

            if (charOffset !== str.length){
                throw "looks like sth went wrong?"
            }
            return lines;
        }

        function processChar(char){
            if (char==="\n"){
                char = "\u21B5" // downwards arrow with corner leftwards
            }
            if (char===" ") {
                char = '\xa0'
            }
            if (char==="\t"){
                char = "\xa0\xa0"
            }
            return char
        }
        function charIsWhitespace(char){
            return char === "\t" || char === " "
        }
        function getValueSpan(char, extraClasses, key, onClick, onMouseEnter, onMouseLeave){
            var className = extraClasses;
            if (charIsWhitespace(char)){
                className += " fromjs-value__whitespace-character"
            }

            var processedChar = processChar(char)

            return <span
                className={className}
                onClick={onClick}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                key={key}
            >
                {processedChar}
            </span>
        }
        function getValueSpans(val, indexOffset){
            var els = [];
            for (let index=0; index<val.length; index++){
                var char = val[index]

                els.push(getValueSpan(char, "", index + indexOffset, () => {
                    self.props.onCharacterClick(index + indexOffset)
                }, () => {
                    if (!self.props.onCharacterHover) {return}
                    self.props.onCharacterHover(index + indexOffset)
                },() => {
                    if (!self.props.onCharacterHover) {return}
                    self.props.onCharacterHover(null)
                }))
            }
            return els
        }

        var val = this.props.text
        var self = this;
        var highlightedCharIndex = this.props.highlightedCharacterIndex

        if (highlightedCharIndex === undefined || highlightedCharIndex === null) {
            return <div className="fromjs-value">
                {getValueSpans(val, 0)}
            </div>
        } else {
            var lines = splitLines(val)

            var valBeforeColumn = val.substr(0, highlightedCharIndex);
            var valAtColumn = val.substr(highlightedCharIndex, 1);
            var valAfterColumn = val.substr(highlightedCharIndex+ 1)

            var highlightedCharLineIndex = valBeforeColumn.split("\n").length

            var showFromLineIndex = highlightedCharLineIndex - 2;
            if (showFromLineIndex < 0) {
                showFromLineIndex = 0;
            }
            var showToLineIndex = showFromLineIndex + 3

            if (!this.state.truncateText) {
                showFromLineIndex = 0;
                showToLineIndex = lines.length;
            }

            var linesToShow = lines.slice(showFromLineIndex, showToLineIndex)

            function getLineComponent(line, beforeSpan, afterSpan){
                var valueSpans = []
                if (line.containsCharIndex(highlightedCharIndex)){
                    var chunks = line.splitAtCharIndex(highlightedCharIndex)

                    var textBeforeHighlight = chunks[0].text
                    if (textBeforeHighlight.length > 40 && self.state.truncateText) {
                        var textA = textBeforeHighlight.slice(0, 40)
                        var textB = textBeforeHighlight.slice(textBeforeHighlight.length - 10)
                        valueSpans = [
                            getValueSpans(textA, chunks[0].charOffsetStart),
                            getEllipsisSpan("ellipsis-line-before-highlight"),
                            getValueSpans(textB, chunks[0].charOffsetStart + textBeforeHighlight.length - textB.length)
                        ]
                    } else {
                        valueSpans = valueSpans.concat(getValueSpans(chunks[0].text, chunks[0].charOffsetStart))
                    }

                    valueSpans = valueSpans.concat(getValueSpan(chunks[1].text, "fromjs-highlighted-character", "highlighted-char-key", function(){}, function(){}, function(){}))

                    var restofLineValueSpans;
                    var textAfterHighlight = chunks[2].text;
                    if (textAfterHighlight.length > 60 && self.state.truncateText){
                        restofLineValueSpans = [
                            getValueSpans(chunks[2].text.slice(0, 60), chunks[2].charOffsetStart),
                            getEllipsisSpan("ellipsis-line-after-highlight")
                        ]
                    } else {
                         restofLineValueSpans = getValueSpans(chunks[2].text, chunks[2].charOffsetStart)
                    }
                    valueSpans = valueSpans.concat(restofLineValueSpans)
                } else {
                    valueSpans = getValueSpans(line.text, line.charOffsetStart);
                }
                return <div key={"Line" + line.lineNumber}>
                    {beforeSpan}
                    {valueSpans}
                    {afterSpan}
                </div>
            }

            function getEllipsisSpan(key){
                return <span onClick={() => self.disableTruncateText()} key={key}>...</span>
            }


            var ret = <HorizontalScrollContainer>
                <div className="fromjs-value">
                    <div className="fromjs-value__content" ref={(el) => {
                        this.scrollToHighlightedChar(el, highlightedCharLineIndex);
                    }}>
                        {linesToShow.map((line, i) =>{
                            var beforeSpan = null;
                            if (i === 0 && line.charOffsetStart > 0){
                                beforeSpan = getEllipsisSpan("beforeEllipsis")
                            }
                            var afterSpan = null;
                            if (i === linesToShow.length - 1 && line.charOffsetEnd < val.length) {
                                afterSpan = getEllipsisSpan("afterEllipsis")
                            }
                            return getLineComponent(line, beforeSpan, afterSpan)
                        })}
                    </div>
                </div>
            </HorizontalScrollContainer>
            return ret;
        }
    }
    scrollToHighlightedChar(el, highlightedCharLineIndex){
        if (!el){return}
        if (this.state.truncateText) {return}
        var lineHeight = 18;
        var lineAtTop = highlightedCharLineIndex - 4;
        if (lineAtTop < 0) {
            lineAtTop = 0;
        }

        el.scrollTop = lineAtTop * lineHeight;
    }
    disableTruncateText(){
        this.setState({truncateText: false})
    }
}


const MAX_LINES_TO_SHOW_BEFORE_AND_AFTER = 200;
class StackFrame extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            resolvedFrame: null,
            truncate: true
        }
    }
    componentDidMount(){
        var inspectedPage = InspectedPage.getCurrentInspectedPage()
        this.cancelFrameResolution = inspectedPage.resolveFrame(this.props.frame, (err, resolvedFrame) => {
            this.setState({resolvedFrame})
        })
    }
    componentWillUnmount(){
        if (this.cancelFrameResolution){
            this.cancelFrameResolution()
        }
    }
    render(){
        function processFrameString(str){
            return str
                .replace(/ /g, '\xa0') //nbsp
                .replace(/\t/g, '\xa0\xa0')
        }

        if (this.state.resolvedFrame === null) {
            return <div style={{padding: 5, paddingLeft: 10}}>Loading...</div>
        }

        var frame = this.state.resolvedFrame;
        var self = this;

        var barSpan = <span className="fromjs-stack__code-column"></span>
        var originPathItem = this.props.originPathItem;

        var highlighNthCharAfterColumn = null;
        if (originPathItem.originObject.action === "String Literal" ){
            highlighNthCharAfterColumn = "'".length + originPathItem.characterIndex
        }
        if (originPathItem.originObject.action === "Initial Page HTML"){
            highlighNthCharAfterColumn = 0;
            barSpan = null;
        }
        var highlightClass = "fromjs-highlighted-character"
        var hasHighlight = highlighNthCharAfterColumn !== null
        if (!hasHighlight) {
            highlighNthCharAfterColumn = 0
            highlightClass = ""
        }

        highlighNthCharAfterColumn = adjustColumnForEscapeSequences(frame.line.substr(frame.columnNumber), highlighNthCharAfterColumn)
        var strBetweenBarAndHighlight = frame.line.substring(frame.columnNumber, frame.columnNumber + highlighNthCharAfterColumn)

        // If strings are too long and would hide highlighted content truncate them
        var strBeforeBar = frame.line.substr(0, frame.columnNumber)
        if (strBeforeBar.length > 50 && this.state.truncate) {
            strBeforeBar = strBeforeBar.substr(0, 10) + "..." + strBeforeBar.substr(strBeforeBar.length - 20)
        }
        if (strBetweenBarAndHighlight.length > 50 && this.state.truncate) {
            strBetweenBarAndHighlight = strBetweenBarAndHighlight.substr(0, 10) + "..." + strBetweenBarAndHighlight.substr(strBetweenBarAndHighlight.length - 20)
        }

        class LineNumber extends React.Component {
            render(){
                var arrow = null;
                if (this.props.arrow){
                    arrow = <div className={"fromjs-stack__line-number-arrow"}>
                        {this.props.arrow}
                    </div>
                }
                return <span
                    className={"fromjs-stack__line-number " + (this.props.arrow ? "fromjs-stack__line-number--has-arrow": "")}>
                    <span className="fromjs-stack__line-number-text">{this.props.lineNumber}</span>
                    {arrow}
                </span>
            }
        }

        function getLine(lineStr, lineNumber, arrow){
            return <div>
                <LineNumber lineNumber={lineNumber} arrow={arrow} />
                <span style={{opacity: .75}}>{processFrameString(lineStr)}</span>
            </div>
        }

        function getPrevLines(){
            if (frame.prevLines.length === 0) {
                return [];
            }

            if (self.state.truncate) {
                return getLine(_.last(frame.prevLines), frame.lineNumber - 1, "\u25B2")
            } else {
                var prevLinesToShow = frame.prevLines;
                if (prevLinesToShow.length > MAX_LINES_TO_SHOW_BEFORE_AND_AFTER) {
                    prevLinesToShow = frame.prevLines.slice(frame.prevLines.length - MAX_LINES_TO_SHOW_BEFORE_AND_AFTER)
                }
                var linesNotShown = frame.prevLines.length - prevLinesToShow.length;
                return prevLinesToShow.map(function(line, i){
                    return getLine(line, i + 1 + linesNotShown)
                })
            }
        }
        function getNextLines(){
            if (frame.nextLines.length === 0) {
                return []
            }
            if (self.state.truncate) {
                return getLine(_.first(frame.nextLines), frame.lineNumber + 1, "\u25BC")
            } else {
                var nextLinesToShow = frame.nextLines;
                if (frame.nextLines.length > MAX_LINES_TO_SHOW_BEFORE_AND_AFTER) {
                    nextLinesToShow = frame.nextLines.slice(0, MAX_LINES_TO_SHOW_BEFORE_AND_AFTER)
                }
                return nextLinesToShow.map(function(line, i){
                    return getLine(line, i + frame.lineNumber + 1)
                })
            }
        }

        var highlightIndexInLine = frame.columnNumber + highlighNthCharAfterColumn
        var highlightedString = processFrameString(frame.line.substr(highlightIndexInLine, 1));
        if (frame.line.length == highlightIndexInLine) {
            // after last proper char in line, display new line
            highlightedString = "\u21B5"
        }
        if (frame.line.length < highlightIndexInLine) {
            debugger // shoudn't happen
        }

        return <div style={{
                display: "block",
                maxHeight: 18 * 7,
                overflow: "auto"
            }} ref={(el) => this.scrollToLine(el, frame.lineNumber)}>
            <HorizontalScrollContainer>
                <div>
                    <code
                        className={"fromjs-stack__code" + (self.state.truncate ? " fromjs-stack__code--truncated" :"")}
                        onClick={() => {
                            if (self.state.truncate){
                                self.setState({truncate: false})
                            }
                        }}
                    >
                        {getPrevLines()}
                        <div>
                            <LineNumber lineNumber={frame.lineNumber} />
                            <span>
                                {processFrameString(strBeforeBar)}
                            </span>
                            {barSpan}
                            <span>
                                {processFrameString(strBetweenBarAndHighlight)}
                            </span>
                            <span className={highlightClass}>
                                {highlightedString}
                            </span>
                            <span>
                                {processFrameString(frame.line.substr(frame.columnNumber + highlighNthCharAfterColumn + 1))}
                            </span>
                        </div>
                        {getNextLines()}
                    </code>
                </div>
            </HorizontalScrollContainer>
        </div>
    }
    scrollToLine(el, lineNumber){
        if (el === null){
            return;
        }
        if (this.state.truncate) {
            return;
        }
        var linesNotShownBefore = this.state.resolvedFrame.prevLines.length - MAX_LINES_TO_SHOW_BEFORE_AND_AFTER;
        if (linesNotShownBefore < 0){
            linesNotShownBefore = 0;
        }

        var lineHeight = 18;
        var scrollToLine = lineNumber - 4 - linesNotShownBefore;
        if (scrollToLine < 0){
            scrollToLine = 0;
        }
        el.scrollTop = scrollToLine * lineHeight;
    }
}

class HorizontalScrollContainer extends React.Component {
    render(){
        return <div className="fromjs-horizontal-scroll-container">
            <div>
                {this.props.children}
            </div>
        </div>
    }
}

class ElementOriginPathContent extends React.Component {
    render(){
        var showPreview = new Boolean(this.props.previewGetOriginPath).valueOf();
        var originPath = <div style={{display: showPreview ? "none" : "block"}}>
            <OriginPath
                getOriginPath={this.props.getOriginPath}
                key={this.props.originPathKey}
                handleValueSpanClick={(origin, characterIndex) => this.props.inspectValue(origin, characterIndex)}
            />
        </div>
        var previewOriginPath = null;
        if (showPreview) {
            previewOriginPath = <div>
                <OriginPath
                    getOriginPath={this.props.previewGetOriginPath}
                    key={this.props.previewOriginPathKey}
                />
            </div>
        }

        var showUpButton = typeof this.props.goUpInDOM === "function"
        var upButton = null;
        if (showUpButton){
            upButton = <div style={{position: "absolute", top: 0, right: 0, border: "1px solid #eee"}}>
                <button
                    data-tip={"Inspect parent element"}
                    onClick={() => this.props.goUpInDOM() }
                    className={"fromjs-go-up-button"}
                    >
                    {"\u21e7"}
                </button>
            </div>
        }

        return <div>
            <div style={{padding: 10}}>
                <div style={{fontWeight: "bold", fontSize: 20, marginBottom: 20}}>
                    Where does this character come from?
                </div>
                <div style={{position: "relative"}}>
                    <div style={{border: "1px solid #ddd",
                        width: showUpButton ? "calc(100% - 30px)" : "100%"}}
                        data-test-marker-inspected-value>
                        <TextEl
                            text={this.props.inspectedValue}
                            highlightedCharacterIndex={this.props.inspectedValueCharacterIndex}
                            onCharacterClick={this.props.onInspectedValueCharacterClick}
                            onCharacterHover={this.props.onInspectedValueCharacterHover}
                        />
                    </div>
                    {upButton}
                </div>
            </div>
            <hr/>
            <div style={{padding: 10}}>
                {originPath}
                {previewOriginPath}
            </div>
        </div>
    }
}

class ElementOriginPath extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            characterIndex: getDefaultInspectedCharacterIndex(props.el.outerHTML),
            previewCharacterIndex: null,
            rootOrigin: null
        }
    }
    render(){
        var sharedProps = {
            inspectedValue: this.getInspectedValue(),
            inspectedValueCharacterIndex: this.state.characterIndex,
            onInspectedValueCharacterClick: (characterIndex) => this.setState({
                characterIndex,
                previewCharacterIndex: null
            }),
            onInspectedValueCharacterHover: (characterIndex) => {
                if (isMobile()) { return }
                this.setState({previewCharacterIndex: characterIndex})
            },
            inspectValue:  (origin, characterIndex) => {
                this.props.onNonElementOriginSelected()
                this.setState({
                    rootOrigin: origin,
                    characterIndex
                })
            }
        }

        var error = null;

        var previewGetOriginPath = null;
        var previewOriginPathKey = null;
        if (this.state.previewCharacterIndex !== null) {
            catchExceptions(() => {
                previewOriginPathKey = this.getOriginPathKey(this.state.previewCharacterIndex)
                previewGetOriginPath = (callback) => this.getOriginPath(this.state.previewCharacterIndex, callback)
            }, err => error = err)
        }

        var getOriginPath = null;
        var originPathKey = null;

        var selectionComponent = null;
        if (this.state.characterIndex !== null) {
            catchExceptions(() => {
                getOriginPath = (callback) => this.getOriginPath(this.state.characterIndex, callback)
                originPathKey = this.getOriginPathKey(this.state.characterIndex)
            }, err => error = err)
        }

        if (error !== null){
            return <div style={{padding: 10}}>{error.toString()}</div>
        }

        return <div>
            <ElementOriginPathContent
                {...sharedProps}
                getOriginPath={getOriginPath}
                originPathKey={originPathKey}
                goUpInDOM={this.props.goUpInDOM}
                previewGetOriginPath={previewGetOriginPath}
                previewOriginPathKey={previewOriginPathKey}
            />
        </div>
    }
    originComesFromElement(){
        return this.state.rootOrigin === null
    }
    getInspectedValue(){
        if (this.state.rootOrigin){
            return this.state.rootOrigin.value
        } else if (this.props.el) {
            var outerHtml = this.props.el.outerHTML
            if (this.props.el.tagName === "BODY") {
                // contains the FromJS UI, which we don't want to show
                var fromJSHtml = document.querySelector(".fromjs-outer-container").outerHTML
                var fromJSStartInBody = outerHtml.indexOf(fromJSHtml)
                var fromJSEndInBody = fromJSStartInBody + fromJSHtml.length
                outerHtml = outerHtml.slice(0, fromJSStartInBody) + outerHtml.slice(fromJSEndInBody)
            }
            return outerHtml
        }
        return null;
    }
    getOriginPath(characterIndex, callback){
        var isCanceled = false

        var info = this.getOriginAndCharacterIndex(characterIndex)
        whereDoesCharComeFrom(info.origin, info.characterIndex, function(){
            if (!isCanceled) {
                callback.apply(this, arguments)
            }
        })

        return function cancel(){
            isCanceled = true;
        }
    }
    getOriginPathKey(characterIndex){
        var info = this.getOriginAndCharacterIndex(characterIndex)
        return JSON.stringify({
            originId: info.origin.id,
            characterIndex: info.characterIndex
        })
    }
    getOriginAndCharacterIndex(characterIndex){
        characterIndex = parseFloat(characterIndex);
        if (this.originComesFromElement()) {
            var useful = getRootOriginAtChar(this.props.el, characterIndex);
            return useful
        } else {
            return {
                characterIndex: characterIndex,
                origin: this.state.rootOrigin
            }
        }
    }
}

class ElementMarker extends React.Component {
    shouldComponentUpdate(newProps){
        return this.props.el !== newProps.el;
    }
    render(){
        var rect = this.props.el.getBoundingClientRect()
        var style = {
            ...this.props.style,
            left: rect.left + document.body.scrollLeft,
            top: rect.top + document.body.scrollTop,
            height: rect.height,
            width: rect.width
        }
        return <div style={style} className="fromjs-element-marker"></div>
    }
}

class SelectedElementMarker extends React.Component {
    render(){
        return <ElementMarker el={this.props.el} style={{outline: "2px solid #0088ff"}} />
    }
}

class PreviewElementMarker extends React.Component {
    render(){
        return <ElementMarker el={this.props.el} style={{outline: "2px solid green"}} />
    }
}

class Intro extends React.Component {
    render(){
        var browserIsChrome = /chrom(e|ium)/.test(navigator.userAgent.toLowerCase());
        var notChromeMessage = null
        if (!browserIsChrome) {
            notChromeMessage = <div style={{border: "2px solid red", padding: 10}}>
                FromJS is currently built to only work in Chrome. It sort of works
                in other browsers too, but some things are broken.
            </div>
        }
        return <div className="fromjs-intro">
            {notChromeMessage}
            <h2>What is this?</h2>
            <p>
                FromJS helps you understand how an app works and how its UI relates to the source code.
            </p>
            <p>
                Select a DOM element on the left to see where its
                content came from. This could be a string in the JavaScript code,
                localStorage data, or directly from the HTML file.
            </p>

            <h2>
                Does this work for all apps?
            </h2>
            <p>
                Sometimes it works, but most of the time it doesn{"'"}t. I slowly trying to support more
                JS functionality. I{"'"}m also working on a
                Chrome extension to make it easier to run FromJS on any page.
            </p>

            <p>
                <a href="https://github.com/mattzeunert/fromjs">Github</a>
                &nbsp;
                &ndash;
                &nbsp;
                <a href="http://www.fromjs.com/">FromJS.com</a>
                &nbsp;
                &ndash;
                &nbsp;
                <a href="https://twitter.com/mattzeunert">Twitter</a>
            </p>
        </div>
    }
}

export class FromJSView extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            el: null,
            previewEl: null,
            // this shoudldn't be needed, should just reset state.el, but right now that wouldn't work
            nonElementOriginSelected: null,
            elId: null
        }

        this.inspectedPage = InspectedPage.getCurrentInspectedPage();

        this.inspectedPage.on("selectElement", (el) => {
            this.setState({
                el: el,
                nonElementOriginSelected: false,
                elId: Math.random() // we need to force an update... this is one way to do it.
            })
        })

        this.inspectedPage.on("previewElement", (el) => {
            this.setState({previewEl: el})
        })
    }
    render(){
        var preview = null;
        var info = null;
        var selectionMarker = null;
        var previewMarker = null;
        var intro = null;

        var showPreview = this.state.previewEl !== null && this.state.previewEl !== this.state.el
        if (showPreview){
            previewMarker = <PreviewElementMarker el={this.state.previewEl}/>
            preview = <ElementOriginPath
                key={this.state.previewEl}
                el={this.state.previewEl}
                goUpInDOM={() => "can't call this function, but needs to be there so button is shown"}
                />
        }
        if (this.state.el) {
            var goUpInDOM = null
            if (!this.state.nonElementOriginSelected && this.state.el.tagName !== "BODY") {
                goUpInDOM = () => this.inspectedPage.trigger("UISelectParentElement")
            }
            info = <div style={{display: showPreview ? "none" : "block"}}>
                <ElementOriginPath
                    key={this.state.el + this.state.elId}
                    el={this.state.el}
                    onNonElementOriginSelected={() => this.setState({nonElementOriginSelected: true})}
                    goUpInDOM={goUpInDOM} />
            </div>
        }

        if (this.state.el && !this.state.nonElementOriginSelected) {
            selectionMarker = <SelectedElementMarker el={this.state.el} />
        }

        if (!this.state.previewEl && !this.state.el){
            intro = <Intro />
        }


        return <div>
            <div id="fromjs" className="fromjs">
                {intro}
                {preview}

                {info}

                {/* Add some spacing since it seems you can't scroll down all the way*/}
                {isMobile() ? <div><br/><br/><br/></div> : null}
                <ReactTooltip effect="solid" />
            </div>
            {previewMarker}
            {selectionMarker}
        </div>
    }
}

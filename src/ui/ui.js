import React from "react"
import _ from "underscore"
import resolveFrame from "../resolve-frame"
import getRootOriginAtChar from "../getRootOriginAtChar"
import whereDoesCharComeFrom from "../whereDoesCharComeFrom"
import getCodeFilePath from "./getCodeFilePath"

function getFilenameFromPath(path){
    var pathParts = path.split("/");
    var filename = _.last(pathParts);
    filename = filename.replace("?dontprocess=yes", "");
    return filename
}

export class OriginPath extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            showFullPath: false
        }
    }
    render(){
        window.originPath = this.props.originPath

        var lastOriginPathStep = _.last(this.props.originPath)
        var firstOriginPathStep = _.first(this.props.originPath)

        var inbetweenSteps = this.props.originPath.slice(1, this.props.originPath.length - 1).reverse();
        var inbetweenStepsComponents = []
        if (this.state.showFullPath){
            for (var originPathStep of inbetweenSteps) {
                inbetweenStepsComponents.push(this.getOriginPathItem(originPathStep))
            }
        }

        var lastStep = this.getOriginPathItem(lastOriginPathStep);
        var firstStep = null;
        if (this.props.originPath.length > 1) {
            firstStep = this.getOriginPathItem(firstOriginPathStep)
        }

        var showFullPathButton = null;
        if (!this.state.showFullPath && this.props.originPath.length > 2){
            showFullPathButton = <div style={{marginBottom: 20}}>
                <button
                    className="fromjs-btn-link"
                    onClick={() => this.setState({showFullPath: true})}>
                    =&gt; Show {inbetweenSteps.length} steps in-between
                </button>
            </div>
        }

        return <div>
            <div style={{marginBottom: 5}}>
                <b>Character origin</b>
            </div>
            {lastStep}
            {showFullPathButton}

            {inbetweenStepsComponents}

            {firstStep}
        </div>
    }
    getOriginPathItem(originPathStep){
        return <OriginPathItem
            key={JSON.stringify(originPathStep)}
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
            showStackFrameSelector: false,
            previewFrameString: null
        }
    }
    componentDidMount(){
        var originObject = this.props.originPathItem.originObject
        if (originObject.isHTMLFileContent) {
            this.selectFrameString(getFrameFromHTMLFileContentOriginPathItem(this.props.originPathItem))
        } else {
            this.selectFrameString(_.first(originObject.stack))
        }
        this.makeSureIsResolvingFrame();
    }
    componentDidUpdate(){
        this.makeSureIsResolvingFrame();
    }
    makeSureIsResolvingFrame(){
        console.log("make sure", this.state)
        var frame = this.state.selectedFrameString
        if (frame && !this.state.resolvedFrame){
            resolveFrame(frame, (err, resolvedFrame) => {
                this.setState({resolvedFrame})

                getCodeFilePath(resolvedFrame.fileName, (codeFilePath) => {
                    this.setState({codeFilePath})
                })
            })
        }
    }
    render(){
        var originObject = this.props.originPathItem.originObject

        var filenameLink = null
        if (this.state.resolvedFrame) {
            var filename = this.state.resolvedFrame.fileName;
            var originalFilename = filename.replace("?dontprocess=yes", "");
            var filenameParts = originalFilename.split("/")
            var uiFilename  = _.last(filenameParts)

            filenameLink = <a className="origin-path-step__filename" href={this.state.codeFilepath} target="_blank">{uiFilename}</a>
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
        if (this.state.showStackFrameSelector){
            stackFrameSelector = <StackFrameSelector
                stack={originObject.stack}
                selectedFrameString={this.state.selectedFrameString}
                onFrameSelected={(frameString) => {
                    this.selectFrameString(frameString)
                    this.setState({showStackFrameSelector: false})
                }}
                onFrameHovered={(frameString) => {
                    this.setState({previewFrameString: frameString})
                }}
            />
        }

        var toggleFrameSelectorButton = null;
        if (originObject.stack && originObject.stack.length > 1) {
            toggleFrameSelectorButton = <button
                className="fromjs-origin-path-step__stack-frame-selector-toggle"
                onClick={() => this.setState({showStackFrameSelector: !this.state.showStackFrameSelector})}>
                {this.state.showStackFrameSelector ? "\u25B2" : "\u25BC"}
            </button>
        }

        return <div style={{border: "1px solid #ddd", marginBottom: 20}}>
            <div >
                <div style={{background: "aliceblue"}}>
                    <span style={{
                        display: "inline-block",
                        padding: 5
                     }}>
                        <span style={{fontWeight: "bold", marginRight: 5}}>
                            {originObject.action}
                        </span>
                        &nbsp;
                        <span>
                            {filenameLink}
                        </span>
                    </span>
                    {toggleFrameSelectorButton}
                </div>

                {stackFrameSelector}

                {stack}
                {previewStack}
            </div>
            <div style={{borderTop: "1px dotted #ddd"}}>
                <ValueEl
                    originPathItem={this.props.originPathItem}
                    handleValueSpanClick={this.props.handleValueSpanClick} />
            </div>
        </div>
    }
    selectFrameString(frameString){
        console.log("selecting frame string", frameString)
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
        resolveFrame(this.props.frameString, (err, resolvedFrame) => {
            this.setState({resolvedFrame})
        })
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
    render(){
        var self = this;
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
        function getValueSpan(char, extraClasses, onClick){
            var className = extraClasses;
            if (charIsWhitespace(char)){
                className = "fromjs-value__whitespace-character"
            }

            var processedChar = processChar(char)


            return <span
                className={className}
                onClick={onClick}
            >
                {processedChar}
                {char === "\n" ? <br/> : null}
            </span>
        }
        function getValueSpans(val, indexOffset){

            var els = [];
            for (let index in val){
                index = parseFloat(index)
                var char = val[index]

                els.push(getValueSpan(char, "", () => {
                    self.props.onCharacterClick(index + indexOffset)
                }))
            }
            return els
        }

        var val = this.props.text
        var highlightedCharIndex = this.props.highlightedCharacterIndex

        if (highlightedCharIndex === undefined || highlightedCharIndex === null) {
            return <div className="fromjs-value">
                {getValueSpans(val, 0)}
            </div>
        } else {
            var valBeforeColumn = val.substr(0, highlightedCharIndex);
            var valAtColumn = val.substr(highlightedCharIndex, 1);
            var valAfterColumn = val.substr(highlightedCharIndex+ 1)

            var beforeColumnValueSpans = getValueSpans(valBeforeColumn, 0)
            // if content is too long to hide the highlight truncate text
            // cut the list of spans rather than the valBeforeColumn string
            // to maintain the correct character index on click on a char
            if (this.state.truncateText && beforeColumnValueSpans.length > 50) {
                var beforeEllipsis = beforeColumnValueSpans.slice(0, 10)
                var afterEllipsis = beforeColumnValueSpans.slice(beforeColumnValueSpans.length - 20)
                beforeColumnValueSpans = [
                    ...beforeEllipsis,
                    <span onClick={() => this.disableTruncation()}>...</span>,
                    ...afterEllipsis
                ]
            }

            var afterColumnValueSpans = getValueSpans(valAfterColumn, valBeforeColumn.length + valAtColumn.length);
            if (this.state.truncateText && afterColumnValueSpans.length > 50){
                afterColumnValueSpans = afterColumnValueSpans.slice(0, 40)
                afterColumnValueSpans.push(<span onClick={() => this.disableTruncation()}>...</span>)
            }

            return <HorizontalScrollContainer>
                <div className="fromjs-value">
                    {beforeColumnValueSpans}
                    {getValueSpan(valAtColumn, "fromjs-highlighted-character", function(){}) }
                    {afterColumnValueSpans}
                </div>
            </HorizontalScrollContainer>
        }


    }
    disableTruncation(){
        this.setState({truncateText: false})
    }
}


class StackFrame extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            resolvedFrame: null
        }
    }
    componentDidMount(){
        resolveFrame(this.props.frame, (err, resolvedFrame) => {
            this.setState({resolvedFrame})
        })
    }
    render(){
        function processFrameString(str){
            return str
                .replace(/ /g, '\xa0') //nbsp
                .replace(/\t/g, '\xa0\xa0')
        }

        if (this.state.resolvedFrame === null) {
            return <div>Loading...</div>
        }

        var frame = this.state.resolvedFrame;

        var originPathItem = this.props.originPathItem;

        var highlighNthCharAfterColumn = null;
        if (originPathItem.originObject.action === "String Literal" ){
            highlighNthCharAfterColumn = "'".length + originPathItem.characterIndex
        }
        var highlightClass = "fromjs-highlighted-character"
        var hasHighlight = highlighNthCharAfterColumn !== null
        if (!hasHighlight) {
            highlighNthCharAfterColumn = 0
            highlightClass = ""
        }

        // OMG this is so fragile and edge case buggy!
        // two chars in a string literal can map to one char in the actual string value (i.e. if there's an escape sequence like
        // "\n" that becomes one new line character)
        var strBetweenBarAndHighlight = frame.line.substring(frame.columnNumber, frame.columnNumber + highlighNthCharAfterColumn)
        highlighNthCharAfterColumn += strBetweenBarAndHighlight.split("\\").length -1
        strBetweenBarAndHighlight = frame.line.substring(frame.columnNumber, frame.columnNumber + highlighNthCharAfterColumn)

        // If strings are too long and would hide highlighted content truncate them
        var strBeforeBar = frame.line.substr(0, frame.columnNumber)
        console.log(strBeforeBar, strBeforeBar.length)
        if (strBeforeBar.length > 50) {
            strBeforeBar = strBeforeBar.substr(0, 10) + "..." + strBeforeBar.substr(strBeforeBar.length - 10)
        }
        if (strBetweenBarAndHighlight.length > 50) {
            strBetweenBarAndHighlight = strBetweenBarAndHighlight.substr(0, 10) + "..." + strBetweenBarAndHighlight.substr(strBetweenBarAndHighlight.length - 20)
        }

        return <HorizontalScrollContainer>
            <code className="fromjs-stack__code" style={{
                paddingTop: 5,
                display: "block",
                paddingBottom: 5
            }}>
                <span className="fromjs-stack__line-number">{frame.lineNumber - 1}</span>
                <span style={{opacity: .6}}>{processFrameString(frame.prevLine)}</span>
                <br/>
                <span className="fromjs-stack__line-number">{frame.lineNumber}</span>
                <span>
                    {processFrameString(strBeforeBar)}
                </span>
                <span style={{color: "#0088ff"}}>|</span>
                <span>
                    {processFrameString(strBetweenBarAndHighlight)}
                </span>
                <span className={highlightClass}>
                    {processFrameString(frame.line.substr(frame.columnNumber + highlighNthCharAfterColumn, 1))}
                </span>
                <span>
                    {processFrameString(frame.line.substr(frame.columnNumber + highlighNthCharAfterColumn + 1))}
                </span>
                <br/>
                <span className="fromjs-stack__line-number">{frame.lineNumber + 1}</span>
                <span style={{opacity: .6}}>{processFrameString(frame.nextLine)}</span>
            </code>
        </HorizontalScrollContainer>
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

class ElementOriginPath extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            characterIndex: this.getDefaultCharacterIndex(props.el),
            rootOrigin: null
        }
    }
    render(){
        var info = null;

        var origin = null;

        if (this.state.characterIndex !== null) {
            var useful = this.getOriginAndCharacterIndex()
            console.log("used origin", useful)
            console.log("has char", useful.origin.value[useful.characterIndex])

            var originPath = whereDoesCharComeFrom(useful.origin, useful.characterIndex)
            origin = <div style={{padding: 10}}>
                <OriginPath
                    originPath={originPath}
                    handleValueSpanClick={(origin, characterIndex) => {
                        console.log("clicked on", characterIndex, origin)
                        this.setState({
                            rootOrigin: origin,
                            characterIndex
                        })
                    }} />
            </div>
        }

        return <div>
            <div style={{padding: 10}}>
                <div style={{border: "1px solid #ddd"}}>
                    {this.props.el ? <TextEl
                        text={this.props.el.outerHTML}
                        highlightedCharacterIndex={this.originComesFromElement() ? this.state.characterIndex : null}
                        onCharacterClick={(characterIndex) => this.setState({characterIndex, rootOrigin: null})}
                        /> : "no el"}
                </div>
            </div>
            <hr/>
            {origin}
        </div>
    }
    originComesFromElement(){
        return this.state.rootOrigin === null
    }
    getOriginAndCharacterIndex(){
        if (this.originComesFromElement()) {
            var characterIndex = parseFloat(this.state.characterIndex);
            var useful = getRootOriginAtChar(this.props.el, characterIndex);
            return useful
        } else {
            return {
                characterIndex: this.state.characterIndex,
                origin: this.state.rootOrigin
            }
        }
    }
    getDefaultCharacterIndex(el){
        console.log("getting default char for", el.outerHTML)
        var defaultCharacterIndex = el.outerHTML.indexOf(">") + 1;
        if (defaultCharacterIndex >= el.outerHTML.length) {
            defaultCharacterIndex = 1;
        }
        return defaultCharacterIndex
    }
}


export class FromJSView extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            el: null,
            previewEl: null,
        }
    }
    render(){
        var preview = null;
        var info = null;
        if (this.state.previewEl !== null && this.state.previewEl !== this.state.el){
            preview = <ElementOriginPath key={this.state.previewEl} el={this.state.previewEl} />
        } else  if (this.state.el) {
            info = <ElementOriginPath key={this.state.el} el={this.state.el}/>
        }


        return <div id="fromjs" className="fromjs">
            {preview}

            {info}
        </div>
    }
    display(el){
        this.setState({
            el: el
        })
    }
    setPreviewEl(el){
        this.setState({previewEl: el})
    }
}

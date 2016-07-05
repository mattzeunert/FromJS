import React from "react"
import _ from "underscore"
import resolveFrame from "../resolve-frame"
import getRootOriginAtChar from "../getRootOriginAtChar"
import whereDoesCharComeFrom from "../whereDoesCharComeFrom"
import getCodeFilePath from "./getCodeFilePath"
import fileIsDynamicCode from "../fileIsDynamicCode"

function getFilenameFromPath(path){
    var pathParts = path.split("/");
    var filename = _.last(pathParts);
    filename = filename.replace("?dontprocess=yes", "");
    return filename
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
            showDetailsDropdown: false,
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
        var viewSourceOriginButton = null;
        if (this.state.resolvedFrame) {
            var filename = this.state.resolvedFrame.fileName;
            var originalFilename = filename.replace("?dontprocess=yes", "");
            var filenameParts = originalFilename.split("/")
            var uiFilename  = _.last(filenameParts)

            filenameLink = <a className="origin-path-step__filename" href={this.state.codeFilepath} target="_blank">{uiFilename}</a>
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
                stack={originObject.stack}
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
            inputValueLinks = <div style={{background: "aliceblue", paddingLeft: 10}}>
                <div>Parameters: </div>
                {originObject.inputValues.map((iv) => {
                    return <div className="fromjs-input-value-link"
                        onClick={() => this.props.handleValueSpanClick(iv, 0)}>
                        &quot;{truncate(iv.value, 40)}&quot; ({iv.action})
                    </div>
                })}
            </div>
        }

        var toggleFrameSelectorButton = null;
        if (originObject.stack && originObject.stack.length > 1) {
            toggleFrameSelectorButton = <button
                className="fromjs-origin-path-step__stack-frame-selector-toggle"
                onClick={() => this.setState({showDetailsDropdown: !this.state.showDetailsDropdown})}>
                {this.state.showDetailsDropdown ? "\u25B2" : "\u25BC"}
            </button>
        }

        return <div className="fromjs-origin-path-step" style={{border: "1px solid #ddd", marginBottom: 20}}>
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
                        &nbsp;{viewSourceOriginButton}


                    </span>
                    {toggleFrameSelectorButton}
                </div>

                {inputValueLinks}
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

        }
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
                    charOffsetStart: charOffsetStart,
                    charOffsetEnd: charOffsetEnd,
                    containsCharIndex: function(index){
                        return index >= charOffsetStart && index < charOffsetEnd
                    },
                    splitAtCharIndex: function(index){
                        var lineBeforeIndex = lineString.substr(0, highlightedCharIndex - charOffsetStart);
                        var lineAtIndex = lineString.substr(highlightedCharIndex - charOffsetStart, 1);
                        var lineAfterIndex = lineString.substr(highlightedCharIndex + 1 - charOffsetStart)
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
        function getValueSpan(char, extraClasses, onClick, onMouseEnter, onMouseLeave){
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
            >
                {processedChar}
            </span>
        }
        function getValueSpans(val, indexOffset){

            var els = [];
            for (let index in val){
                index = parseFloat(index)
                var char = val[index]

                els.push(getValueSpan(char, "", () => {
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

            var showFromLineIndex = highlightedCharLineIndex - 3;
            if (showFromLineIndex < 0) {
                showFromLineIndex = 0;
            }

            var linesToShow = lines.slice(showFromLineIndex, showFromLineIndex + 5)

            function getLineComponent(line, beforeSpan, afterSpan){
                var valueSpans = []
                if (line.containsCharIndex(highlightedCharIndex)){
                    var chunks = line.splitAtCharIndex(highlightedCharIndex)

                    valueSpans = valueSpans.concat(getValueSpans(chunks[0].text, chunks[0].charOffsetStart))
                    valueSpans = valueSpans.concat(getValueSpan(chunks[1].text, "fromjs-highlighted-character", function(){}, function(){}, function(){}))
                    valueSpans = valueSpans.concat(getValueSpans(chunks[2].text, chunks[2].charOffsetStart))
                } else {
                    valueSpans = getValueSpans(line.text, line.charOffsetStart);
                }
                return <div>
                    {beforeSpan}
                    {valueSpans}
                    {afterSpan}
                </div>
            }

            return <HorizontalScrollContainer>
                <div className="fromjs-value">
                    {linesToShow.map(function(line, i){
                        var beforeSpan = null;
                        if (i === 0 && line.charOffsetStart > 0){
                            beforeSpan = <span>...</span>
                        }
                        var afterSpan = null;
                        if (i === linesToShow.length - 1 && line.charOffsetEnd < val.length) {
                            afterSpan = <span>...</span>
                        }
                        return getLineComponent(line, beforeSpan, afterSpan)
                    })}
                </div>
            </HorizontalScrollContainer>
        }
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
        // console.log(strBeforeBar, strBeforeBar.length)
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

class ElementOriginPathContent extends React.Component {
    render(){
        return <div>
            <div style={{padding: 10}}>
                <div style={{fontWeight: "bold", fontSize: 20, marginBottom: 20}}>
                    Where does this character come from?
                </div>
                <div style={{border: "1px solid #ddd"}}>
                    <TextEl
                        text={this.props.inspectedValue}
                        highlightedCharacterIndex={this.props.inspectedValueCharacterIndex}
                        onCharacterClick={this.props.onInspectedValueCharacterClick}
                        onCharacterHover={this.props.onInspectedValueCharacterHover}
                    />
                </div>
            </div>
            <hr/>
            <div style={{padding: 10}}>
                <OriginPath
                    originPath={this.props.originPath}
                    handleValueSpanClick={(origin, characterIndex) => this.props.inspectValue(origin, characterIndex)}
                />
            </div>
        </div>
    }
}

class ElementOriginPath extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            characterIndex: this.getDefaultCharacterIndex(props.el),
            previewCharacterIndex: null,
            rootOrigin: null
        }
    }
    render(){
        var sharedProps = {
            inspectedValue: this.getInspectedValue(),
            inspectedValueCharacterIndex: this.state.characterIndex,
            onInspectedValueCharacterClick: (characterIndex) => this.setState({characterIndex}),
            onInspectedValueCharacterHover: (characterIndex) => this.setState({previewCharacterIndex: characterIndex}),
            inspectValue:  (origin, characterIndex) => {
                this.props.onNonElementOriginSelected()
                this.setState({
                    rootOrigin: origin,
                    characterIndex
                })
            }
        }

        var selectionComponent = null;
        if (this.state.characterIndex !== null) {
            var display = "block"
            if (this.state.previewCharacterIndex !== null) {
                display = "none"
            }
            selectionComponent = <div style={{display: display}}>
                <ElementOriginPathContent
                    {...sharedProps}
                    originPath={this.getOriginPath(this.state.characterIndex)}
                />
            </div>
        }

        var previewComponent = null;
        if (this.state.previewCharacterIndex !== null) {
            previewComponent = <ElementOriginPathContent
                    {...sharedProps}
                    originPath={this.getOriginPath(this.state.previewCharacterIndex)}
                />
        }

        return <div>
            {selectionComponent}
            {previewComponent}
        </div>

    }
    originComesFromElement(){
        return this.state.rootOrigin === null
    }
    getInspectedValue(){
        if (this.state.rootOrigin){
            return this.state.rootOrigin.value
        } else if (this.props.el) {
            return this.props.el.outerHTML
        }
        return null;
    }
    getOriginPath(characterIndex){
        var info = this.getOriginAndCharacterIndex(characterIndex)
        return whereDoesCharComeFrom(info.origin, info.characterIndex)
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
    getDefaultCharacterIndex(el){
        // console.log("getting default char for", el.outerHTML)
        var defaultCharacterIndex = el.outerHTML.indexOf(">") + 1;
        if (defaultCharacterIndex >= el.outerHTML.length) {
            defaultCharacterIndex = 1;
        }
        return defaultCharacterIndex
    }
}

class ElementMarker extends React.Component {
    render(){
        var rect = this.props.el.getBoundingClientRect()
        var style = {
            ...this.props.style,
            left: rect.left,
            top: rect.top,
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

export class FromJSView extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            el: null,
            previewEl: null,
            // this shoudldn't be needed, should just reset state.el, but right now that wouldn't work
            nonElementOriginSelected: null
        }
    }
    render(){
        var preview = null;
        var info = null;
        var selectionMarker = null;
        var previewMarker = null;
        if (this.state.previewEl !== null && this.state.previewEl !== this.state.el){
            previewMarker = <PreviewElementMarker el={this.state.previewEl}/>
            preview = <ElementOriginPath key={this.state.previewEl} el={this.state.previewEl} />
        } else  if (this.state.el) {
            info = <ElementOriginPath key={this.state.el} el={this.state.el} onNonElementOriginSelected={() => this.setState({nonElementOriginSelected: true})}/>
        }

        if (this.state.el && !this.state.nonElementOriginSelected) {
            selectionMarker = <SelectedElementMarker el={this.state.el} />
        }


        return <div>
            <div id="fromjs" className="fromjs">
                {preview}

                {info}
            </div>
            {previewMarker}
            {selectionMarker}
        </div>
    }
    display(el){
        this.setState({
            el: el,
            nonElementOriginSelected: false
        })
    }
    setPreviewEl(el){
        this.setState({previewEl: el})
    }
}

import React from "react"
import _ from "underscore"
import resolveFrame from "../../st/resolve-frame"

export class OriginPath extends React.Component {
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

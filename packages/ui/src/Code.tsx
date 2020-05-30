import * as React from "react";
import HorizontalScrollContainer from "./HorizontalScrollContainer";
import "./Code.scss";

interface CodeProps {
  resolvedStackFrame: any;
  traversalStep: any;
  highlighNthCharAfterColumn: any;
}

interface CodeState {
  surroundingLineCount: number;
}

export default class Code extends React.Component<CodeProps, CodeState> {
  constructor(props) {
    super(props);
    this.state = {
      surroundingLineCount: props.defaultSurroundingLineCount || 3,
    };
  }
  render() {
    function processFrameString(str) {
      return str
        .replace(/ /g, "\xa0") //nbsp
        .replace(/\t/g, "\xa0\xa0");
    }

    var frame = this.props.resolvedStackFrame;
    var self = this;

    var barSpan = <span className="fromjs-stack__code-column" />;

    var highlighNthCharAfterColumn = this.props.highlighNthCharAfterColumn;

    var highlightClass = "fromjs-highlighted-character";
    var hasHighlight = highlighNthCharAfterColumn !== null;
    if (!hasHighlight) {
      highlighNthCharAfterColumn = 0;
      highlightClass = "";
    }

    const columnNumber = frame.columnNumber;

    if (!frame.code) {
      return (
        "No code for frame: " + JSON.stringify(frame, null, 2).slice(0, 100)
      );
    }

    const lineFirstCharIndex = frame.code.line.firstCharIndex;
    var strBetweenBarAndHighlight = frame.code.line.text.substring(
      columnNumber - lineFirstCharIndex,
      columnNumber + highlighNthCharAfterColumn - lineFirstCharIndex
    );

    const truncate = this.state.surroundingLineCount < 6;

    // If strings are too long and would hide highlighted content truncate them
    var strBeforeBar = frame.code.line.text.substr(
      0,
      columnNumber - lineFirstCharIndex
    );

    // 1 char is around 10px wide
    let truncationSettings = {
      minLength: 30,
      charsAtStart: 8,
      charsBefore: 20,
      minLengthBarToHighlight: 20,
    };
    if (document.body.clientWidth > 700) {
      truncationSettings = {
        minLength: 40,
        charsAtStart: 10,
        charsBefore: 25,
        minLengthBarToHighlight: 20,
      };
    }
    if (document.body.clientWidth > 1000) {
      truncationSettings = {
        minLength: 60,
        charsAtStart: 15,
        charsBefore: 35,
        minLengthBarToHighlight: 20,
      };
    }

    if (strBeforeBar.length > truncationSettings.minLength && truncate) {
      strBeforeBar =
        strBeforeBar.substr(0, truncationSettings.charsAtStart) +
        "..." +
        strBeforeBar.substr(
          strBeforeBar.length - truncationSettings.charsBefore
        );
    }
    if (
      strBetweenBarAndHighlight.length >
        truncationSettings.minLengthBarToHighlight &&
      truncate
    ) {
      strBetweenBarAndHighlight =
        strBetweenBarAndHighlight.substr(0, truncationSettings.charsAtStart) +
        "..." +
        strBetweenBarAndHighlight.substr(
          strBetweenBarAndHighlight.length - truncationSettings.charsBefore
        );
    }

    var highlightIndexInLine = columnNumber + highlighNthCharAfterColumn;
    var highlightedString = processFrameString(
      frame.code.line.text.substr(
        highlightIndexInLine - frame.code.line.firstCharIndex,
        1
      )
    );

    if (frame.code.line.text.length == highlightIndexInLine) {
      // after last proper char in line, display new line
      highlightedString = "\u21B5";
    }
    if (frame.code.line.text.length < highlightIndexInLine) {
      // debugger; // shoudn't happen
    }

    const strAfterBar = frame.code.line.text.substr(
      columnNumber +
        highlighNthCharAfterColumn +
        highlightedString.length -
        lineFirstCharIndex
    );

    interface LineNumberProps {
      arrow?: string;
      lineNumber: number;
    }
    class LineNumber extends React.Component<LineNumberProps, {}> {
      render() {
        var arrow = null;
        if (this.props.arrow) {
          arrow = (
            <div className={"fromjs-stack__line-number-arrow"}>
              {this.props.arrow}
            </div>
          );
        }
        return (
          <span
            className={
              "fromjs-stack__line-number " +
              (this.props.arrow ? "fromjs-stack__line-number--has-arrow" : "")
            }
          >
            <span className="fromjs-stack__line-number-text">
              {this.props.lineNumber}
            </span>
            {arrow}
          </span>
        );
      }
    }

    function getLine(lineStr, lineNumber, arrow?) {
      return (
        <div key={"line" + lineNumber}>
          <LineNumber lineNumber={lineNumber} arrow={arrow} />
          <span style={{ opacity: 0.75 }}>{processFrameString(lineStr)}</span>
        </div>
      );
    }

    const surroundingLineCount = this.state.surroundingLineCount;

    function getPrevLines() {
      if (frame.code.previousLines.length === 0) {
        return [];
      }

      var previousLines = frame.code.previousLines
        .slice(-surroundingLineCount)
        .map((l) => l.text);

      return previousLines.map(function (line, i) {
        return getLine(
          line,
          frame.lineNumber + i - previousLines.length,
          i === 0 ? "\u25B2" : ""
        );
      });
    }
    function getNextLines() {
      if (frame.code.nextLines.length === 0) {
        return [];
      }
      var nextLines = frame.code.nextLines
        .slice(0, surroundingLineCount)
        .map((l) => l.text);
      return nextLines.map(function (line, i) {
        return getLine(
          line,
          frame.lineNumber + 1 + i,
          i === nextLines.length - 1 ? "\u25BC" : ""
        );
      });
    }

    return (
      <div
        style={{
          display: "block",
          // maxHeight: 18 * 7,
          overflow: "auto",
        }}
        ref={(el) => this.scrollToLine(el, frame.lineNumber)}
      >
        <HorizontalScrollContainer>
          <div>
            <code
              className={
                "fromjs-stack__code" +
                (true ? " fromjs-stack__code--truncated" : "")
              }
              onClick={() => {
                let nextSurroundingLineCount = {
                  // 1: 3,
                  3: 7,
                  5: 7,
                  7: 20,
                  20: 3,
                }[surroundingLineCount];
                if (!nextSurroundingLineCount) {
                  nextSurroundingLineCount = 7;
                }

                self.setState({
                  surroundingLineCount: nextSurroundingLineCount,
                });
              }}
            >
              {getPrevLines()}
              <div style={{ background: "#fff0f0" }} data-test-highlighted-line>
                <LineNumber lineNumber={frame.lineNumber} />
                <span>{processFrameString(strBeforeBar)}</span>
                {barSpan}
                <span>{processFrameString(strBetweenBarAndHighlight)}</span>
                <span className={highlightClass}>{highlightedString}</span>
                <span>{processFrameString(strAfterBar)}</span>
              </div>
              {getNextLines()}
            </code>
          </div>
        </HorizontalScrollContainer>
      </div>
    );
  }
  scrollToLine(el, lineNumber) {
    // if (el === null) {
    //   return;
    // }
    // if (this.state.truncate) {
    //   return;
    // }
    // var linesNotShownBefore =
    //   this.state.resolvedFrame.prevLines.length -
    //   MAX_LINES_TO_SHOW_BEFORE_AND_AFTER;
    // if (linesNotShownBefore < 0) {
    //   linesNotShownBefore = 0;
    // }
    // var lineHeight = 18;
    // var scrollToLine = lineNumber - 4 - linesNotShownBefore;
    // if (scrollToLine < 0) {
    //   scrollToLine = 0;
    // }
    // el.scrollTop = scrollToLine * lineHeight;
  }
}

import * as React from "react";
import HorizontalScrollContainer from "./HorizontalScrollContainer";
import { ResolvedStackFrame } from "@fromjs/backend/dist/src/StackFrameResolver";
import "./Code.scss";

interface CodeProps {
  resolvedStackFrame: ResolvedStackFrame;
  traversalStep: any;
}

interface CodeState {
  surroundingLineCount: number;
}

const MAX_LINES_TO_SHOW_BEFORE_AND_AFTER = 200;
export default class Code extends React.Component<CodeProps, CodeState> {
  constructor(props) {
    super(props);
    this.state = {
      surroundingLineCount: 1
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
    // var originPathItem = this.props.originPathItem;

    var highlighNthCharAfterColumn = null;
    // if (originPathItem.origin.action === "String Literal") {
    //   highlighNthCharAfterColumn = "'".length + originPathItem.characterIndex;
    // }
    // if (originPathItem.origin.action === "Initial Page HTML") {
    //   highlighNthCharAfterColumn = 0;
    //   barSpan = null;
    // }

    var highlightClass = "fromjs-highlighted-character";
    var hasHighlight = highlighNthCharAfterColumn !== null;
    if (!hasHighlight) {
      highlighNthCharAfterColumn = 0;
      highlightClass = "";
    }

    // highlighNthCharAfterColumn = adjustColumnForEscapeSequences(
    //   frame.line.substr(frame.columnNumber),
    //   highlighNthCharAfterColumn
    // );
    const columnNumber = frame.columnNumber;
    var strBetweenBarAndHighlight = frame.code.line.text.substring(
      columnNumber,
      columnNumber + highlighNthCharAfterColumn
    );

    const truncate = this.state.surroundingLineCount < 2;

    // If strings are too long and would hide highlighted content truncate them
    var strBeforeBar = frame.code.line.text.substr(0, columnNumber);
    if (strBeforeBar.length > 50 && truncate) {
      strBeforeBar =
        strBeforeBar.substr(0, 10) +
        "..." +
        strBeforeBar.substr(strBeforeBar.length - 20);
    }
    if (strBetweenBarAndHighlight.length > 50 && truncate) {
      strBetweenBarAndHighlight =
        strBetweenBarAndHighlight.substr(0, 10) +
        "..." +
        strBetweenBarAndHighlight.substr(strBetweenBarAndHighlight.length - 20);
    }

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

      // if (self.state.truncate) {
      var previousTwo = frame.code.previousLines
        .slice(-surroundingLineCount)
        .map(l => l.text);

      return previousTwo.map(function(line, i) {
        return getLine(line, frame.lineNumber - i - 1, i === 0 ? "\u25B2" : "");
      });
      // } else {
      //   var prevLinesToShow = frame.previousLines;
      //   if (prevLinesToShow.length > MAX_LINES_TO_SHOW_BEFORE_AND_AFTER) {
      //     prevLinesToShow = frame.code.previousLines.slice(
      //       frame.code.previousLines.length - MAX_LINES_TO_SHOW_BEFORE_AND_AFTER
      //     );
      //   }
      //   var linesNotShown =
      //     frame.code.previousLines.length - prevLinesToShow.length;
      //   return prevLinesToShow.map(l => l.text).map(function(line, i) {
      //     return getLine(line, i + 1 + linesNotShown);
      //   });
      // }
    }
    function getNextLines() {
      if (frame.code.nextLines.length === 0) {
        return [];
      }
      // if (self.state.truncate) {
      var nextTwo = frame.code.nextLines
        .slice(0, surroundingLineCount)
        .map(l => l.text);
      return nextTwo.map(function(line, i) {
        return getLine(
          line,
          frame.lineNumber + 1 + i,
          i === nextTwo.length - 1 ? "\u25BC" : ""
        );
      });
      // } else {
      //   var nextLinesToShow = frame.code.nextLines;
      //   if (frame.code.nextLines.length > MAX_LINES_TO_SHOW_BEFORE_AND_AFTER) {
      //     nextLinesToShow = frame.code.nextLines
      //       .slice(0, MAX_LINES_TO_SHOW_BEFORE_AND_AFTER)
      //       .map(l => l.text);
      //   }
      //   return nextLinesToShow.map(function(line, i) {
      //     return getLine(line, i + frame.lineNumber + 1);
      //   });
      // }
    }

    var highlightIndexInLine = columnNumber + highlighNthCharAfterColumn;
    var highlightedString = processFrameString(
      frame.code.line.text.substr(highlightIndexInLine, 1)
    );
    if (frame.code.line.length == highlightIndexInLine) {
      // after last proper char in line, display new line
      highlightedString = "\u21B5";
    }
    if (frame.code.line.text.length < highlightIndexInLine) {
      // debugger; // shoudn't happen
    }

    return (
      <div
        style={{
          display: "block",
          // maxHeight: 18 * 7,
          overflow: "auto"
        }}
        ref={el => this.scrollToLine(el, frame.lineNumber)}
      >
        <HorizontalScrollContainer>
          <div>
            <code
              className={
                "fromjs-stack__code" +
                (true ? " fromjs-stack__code--truncated" : "")
              }
              onClick={() => {
                const nextSurroundingLineCount = {
                  1: 3,
                  3: 7,
                  7: 1
                };

                self.setState({
                  surroundingLineCount:
                    nextSurroundingLineCount[surroundingLineCount]
                });
              }}
            >
              {getPrevLines()}
              <div>
                <LineNumber lineNumber={frame.lineNumber} />
                <span>{processFrameString(strBeforeBar)}</span>
                {barSpan}
                <span>{processFrameString(strBetweenBarAndHighlight)}</span>
                <span className={highlightClass}>{highlightedString}</span>
                <span>
                  {processFrameString(
                    frame.code.line.text.substr(
                      columnNumber + highlighNthCharAfterColumn + 1
                    )
                  )}
                </span>
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

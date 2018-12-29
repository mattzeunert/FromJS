import * as React from "react";
import "./textEl.scss";
import HorizontalScrollContainer from "./HorizontalScrollContainer";
export class TextEl extends React.Component<any, any> {
  constructor(props) {
    super(props);
    this.state = {
      truncateText: true
    };
  }
  shouldComponentUpdate(nextProps, nextState) {
    // console.time("TextEl shouldUpdate")
    var shouldUpdate =
      JSON.stringify(nextProps) !== JSON.stringify(this.props) ||
      JSON.stringify(nextState) !== JSON.stringify(this.state);
    // console.timeEnd("TextEl shouldUpdate")
    return shouldUpdate;
  }
  render() {
    var self = this;

    function splitLines(str) {
      var lineStrings = str.split("\n");
      var lines = [];
      var charOffset = 0;
      lineStrings.forEach(function(lineString, i) {
        var isLastLine = i + 1 === lineStrings.length;
        var text = lineString + (isLastLine ? "" : "\n");
        var charOffsetStart = charOffset;
        var charOffsetEnd = charOffset + text.length;
        lines.push({
          text: text,
          lineNumber: i,
          charOffsetStart: charOffsetStart,
          charOffsetEnd: charOffsetEnd,
          containsCharIndex: function(index) {
            return index >= charOffsetStart && index < charOffsetEnd;
          },
          splitAtCharIndex: function(index) {
            var lineBeforeIndex = text.substr(
              0,
              highlightedCharIndex - charOffsetStart
            );
            var lineAtIndex = text.substr(
              highlightedCharIndex - charOffsetStart,
              1
            );
            var lineAfterIndex = text.substr(
              highlightedCharIndex + 1 - charOffsetStart
            );
            return [
              {
                text: lineBeforeIndex,
                charOffsetStart: charOffsetStart
              },
              {
                text: lineAtIndex,
                charOffsetStart: charOffsetStart + lineBeforeIndex.length
              },
              {
                text: lineAfterIndex,
                charOffsetStart:
                  charOffsetStart + lineBeforeIndex.length + lineAtIndex.length
              }
            ];
          }
        });
        charOffset = charOffsetEnd;
      });

      if (charOffset !== str.length) {
        throw "looks like sth went wrong?";
      }
      return lines;
    }

    function processChar(char) {
      if (char === "\n") {
        char = "\u21B5"; // downwards arrow with corner leftwards
      }
      if (char === " ") {
        char = "\xa0";
      }
      if (char === "\t") {
        char = "\xa0\xa0";
      }
      return char;
    }
    function charIsWhitespace(char) {
      return char === "\t" || char === " ";
    }
    function getValueSpan(
      char,
      extraClasses,
      key,
      onClick,
      onMouseEnter,
      onMouseLeave
    ) {
      var className = extraClasses;
      if (charIsWhitespace(char)) {
        className += " fromjs-value__whitespace-character";
      }

      var processedChar = processChar(char);

      return (
        <span
          className={className}
          data-key={key}
          onClick={onClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          key={key}
        >
          {processedChar}
        </span>
      );
    }
    function getValueSpans(val, indexOffset) {
      var els = [];
      for (let index = 0; index < val.length; index++) {
        var char = val[index];
        const charIndex = index + indexOffset;

        els.push(
          getValueSpan(
            char,
            "",
            charIndex,
            () => {
              self.props.onCharacterClick(charIndex);
            },
            () => {
              if (!self.props.onCharacterHover) {
                return;
              }
              self.props.onCharacterHover(charIndex);
            },
            () => {
              if (!self.props.onCharacterHover) {
                return;
              }
              self.props.onCharacterHover(null);
            }
          )
        );
      }
      return els;
    }

    var val = this.props.text;
    if (!val) {
      console.log("NO TEXTEL VAL");
      val = "";
    }

    var self = this;
    var highlightedCharIndex = this.props.highlightedCharacterIndex;

    if (highlightedCharIndex === undefined || highlightedCharIndex === null) {
      return <div className="fromjs-value">{getValueSpans(val, 0)}</div>;
    } else {
      var lines = splitLines(val);

      var valBeforeColumn = val.substr(0, highlightedCharIndex);
      var valAtColumn = val.substr(highlightedCharIndex, 1);
      var valAfterColumn = val.substr(highlightedCharIndex + 1);

      var highlightedCharLineIndex = valBeforeColumn.split("\n").length;

      const numberOflinesToShow = this.state.truncateText ? 2 : 10;

      var showFromLineIndex = highlightedCharLineIndex - numberOflinesToShow;
      if (showFromLineIndex < 0) {
        showFromLineIndex = 0;
      }
      var showToLineIndex = showFromLineIndex + numberOflinesToShow + 1;

      if (showToLineIndex > lines.length) {
        showToLineIndex = lines.length;
      }

      var linesToShow = lines.slice(showFromLineIndex, showToLineIndex);

      let truncationConfig = {
        minLength: 40,
        beforeHighlight: 15
      };
      if (document.body.clientWidth > 600) {
        truncationConfig = {
          minLength: 70,
          beforeHighlight: 30
        };
      }
      if (document.body.clientWidth > 900) {
        truncationConfig = {
          minLength: 100,
          beforeHighlight: 40
        };
      }

      function getLineComponent(line, beforeSpan, afterSpan) {
        var valueSpans = [];
        if (line.containsCharIndex(highlightedCharIndex)) {
          var chunks = line.splitAtCharIndex(highlightedCharIndex);

          var textBeforeHighlight = chunks[0].text;
          if (
            textBeforeHighlight.length > truncationConfig.minLength &&
            self.state.truncateText
          ) {
            var textA = textBeforeHighlight.slice(
              0,
              truncationConfig.beforeHighlight
            );
            var textB = textBeforeHighlight.slice(
              textBeforeHighlight.length - 15
            );
            valueSpans = [
              getValueSpans(textA, chunks[0].charOffsetStart),
              getEllipsisSpan("ellipsis-line-before-highlight"),
              getValueSpans(
                textB,
                chunks[0].charOffsetStart +
                  textBeforeHighlight.length -
                  textB.length
              )
            ];
          } else {
            valueSpans = valueSpans.concat(
              getValueSpans(chunks[0].text, chunks[0].charOffsetStart)
            );
          }

          valueSpans = valueSpans.concat(
            getValueSpan(
              chunks[1].text,
              "fromjs-highlighted-character",
              "highlighted-char-key",
              function() {},
              function() {},
              function() {}
            )
          );

          var restofLineValueSpans;
          var textAfterHighlight = chunks[2].text;
          if (textAfterHighlight.length > 100 && self.state.truncateText) {
            restofLineValueSpans = [
              getValueSpans(
                chunks[2].text.slice(0, 80),
                chunks[2].charOffsetStart
              ),
              getEllipsisSpan("ellipsis-line-after-highlight")
            ];
          } else {
            restofLineValueSpans = getValueSpans(
              chunks[2].text,
              chunks[2].charOffsetStart
            );
          }
          valueSpans = valueSpans.concat(restofLineValueSpans);
        } else {
          valueSpans = getValueSpans(line.text, line.charOffsetStart);
        }
        return (
          <div key={"Line" + line.lineNumber}>
            {beforeSpan}
            {valueSpans}
            {afterSpan}
          </div>
        );
      }

      function getEllipsisSpan(key) {
        return (
          <span onClick={() => self.disableTruncateText()} key={key}>
            ...
          </span>
        );
      }

      var ret = (
        <HorizontalScrollContainer>
          <div className="fromjs-value">
            <div
              className="fromjs-value__content"
              ref={el => {
                this.scrollToHighlightedChar(el, highlightedCharLineIndex);
              }}
            >
              {linesToShow.map((line, i) => {
                var beforeSpan = null;
                if (i === 0 && line.charOffsetStart > 0) {
                  beforeSpan = getEllipsisSpan("beforeEllipsis");
                }
                var afterSpan = null;
                if (
                  i === linesToShow.length - 1 &&
                  line.charOffsetEnd < val.length
                ) {
                  afterSpan = getEllipsisSpan("afterEllipsis");
                }
                return getLineComponent(line, beforeSpan, afterSpan);
              })}
            </div>
          </div>
        </HorizontalScrollContainer>
      );
      return ret;
    }
  }
  scrollToHighlightedChar(el, highlightedCharLineIndex) {
    if (!el) {
      return;
    }
    if (this.state.truncateText) {
      return;
    }
    var lineHeight = 18;
    var lineAtTop = highlightedCharLineIndex - 4;
    if (lineAtTop < 0) {
      lineAtTop = 0;
    }

    el.scrollTop = lineAtTop * lineHeight;
  }
  disableTruncateText() {
    if (!this.state.truncateText) {
      alert("Not showing more because it might be freeze the UI");
    }
    this.setState({ truncateText: false });
  }
}

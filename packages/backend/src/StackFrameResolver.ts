var StackTraceGPS = require("stacktrace-gps");
var ErrorStackParser = require("error-stack-parser");
var request = require("request");
// var { prettifyAndMapFrameObject } = require("./prettify");

function ajax(url) {
  return new Promise(function (resolve, reject) {
    var r = request.defaults({ proxy: "http://127.0.0.1:8081" });
    r(
      {
        url,
        rejectUnauthorized: false // fix UNABLE_TO_VERIFY_LEAF_SIGNATURE when loading trello board
      },
      function (err, res, body) {
        if (err) {
          console.error("request source maping error", err, url);
        } else {
          resolve(body);
        }
      }
    );
  });
}

function getSourceCodeObject(frameObject, code) {
  function makeLine(fullLine, focusColumn) {
    try {
      var text = fullLine;
      var firstCharIndex = 0;
      var lastCharIndex = fullLine.length;
      if (fullLine.length > 100) {
        firstCharIndex = focusColumn - 50;
        if (firstCharIndex < 0) {
          firstCharIndex = 0;
        }
        lastCharIndex = firstCharIndex + 100;
        text = fullLine.slice(firstCharIndex, lastCharIndex);
      }
      return {
        length: fullLine.length,
        firstCharIndex,
        lastCharIndex,
        text
      };
    } catch (err) {
      return {
        error: err.toString()
      };
    }
  }

  var lines = code.split("\n");

  if (!lines[frameObject.lineNumber - 1]) {
    console.log(
      "line doesn't exist - maybe because the frame being mapped is inside init.js and doesn't map anywhere?"
    );
  }

  return {
    line: makeLine(lines[frameObject.lineNumber - 1], frameObject.columnNumber),
    previousLines: lines
      .slice(frameObject.lineNumber - 1 - 3, frameObject.lineNumber - 1)
      .map(l => makeLine(l, 0)),
    nextLines: lines
      .slice(frameObject.lineNumber, frameObject.lineNumber + 1 + 3)
      .map(l => makeLine(l, 0))
  };
}

class StackFrameResolver {
  constructor() {
    this._cache = {};
    this._gps = new StackTraceGPS({ ajax });
  }

  resolveSourceCode(frameObject) {
    return this._fetchCode(frameObject).then(code => {
      return getSourceCodeObject(frameObject, code);
    });
  }

  _fetchCode(frameObject) {
    return this._gps.ajax(frameObject.fileName);
  }

  _resolveFrame(frameString, prettify) {
    return new Promise(resolve => {
      var cacheKey = frameString + (prettify ? "Pretty" : "Nonpretty");
      if (this._cache[cacheKey]) {
        return resolve(this._cache[cacheKey]);
      }

      var frameObject = ErrorStackParser.parse({ stack: frameString })[0];

      const finish = frame => {
        frame.fileName = frame.fileName.replace(".dontprocess", "");
        this._cache[cacheKey] = frame;
        resolve(frame);
      };

      var gps = this._gps;
      gps.pinpoint(frameObject).then(
        newFrame => {
          if (!prettify) {
            this.resolveSourceCode(newFrame).then(code => {
              newFrame.code = code;
              newFrame.__debugOnly_FrameString = frameString
              finish(newFrame);
            });
          } else {
            // this._fetchCode(newFrame).then(code => {
            //   var { mappedFrameObject, formatted } = prettifyAndMapFrameObject(
            //     code,
            //     newFrame
            //   );
            //   mappedFrameObject.code = getSourceCodeObject(
            //     mappedFrameObject,
            //     formatted
            //   );
            //   finish(mappedFrameObject);
            // });
          }
        },
        function () {
          console.log("Pinpoint failed!", arguments);
          finish(frameObject);
        }
      );
    });
  }

  resolveFrame(frameString) {
    return this._resolveFrame(frameString, false);
  }

  resolveFrameAndPrettify(frameString) {
    return this._resolveFrame(frameString, true);
  }
}

export default StackFrameResolver;

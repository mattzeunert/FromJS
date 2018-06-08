var StackTraceGPS = require("stacktrace-gps");
var ErrorStackParser = require("error-stack-parser");
var request = require("request");
// var { prettifyAndMapFrameObject } = require("./prettify");

export interface ResolvedStackFrameCodeLine {
  text: string;
}

export interface ResolvedStackFrame {
  code: {
    previousLines: ResolvedStackFrameCodeLine[];
    line: ResolvedStackFrameCodeLine;
    nextLines: ResolvedStackFrameCodeLine[];
  };
  columnNumber: number;
  lineNumber: number;
  fileName: string;
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

  const NUMBER_OF_LINES_TO_LOAD = 7;

  return {
    line: makeLine(lines[frameObject.lineNumber - 1], frameObject.columnNumber),
    previousLines: lines
      .slice(
        frameObject.lineNumber - 1 - NUMBER_OF_LINES_TO_LOAD,
        frameObject.lineNumber - 1
      )
      .map(l => makeLine(l, 0)),
    nextLines: lines
      .slice(
        frameObject.lineNumber,
        frameObject.lineNumber + 1 + NUMBER_OF_LINES_TO_LOAD
      )
      .map(l => makeLine(l, 0))
  };
}

class StackFrameResolver {
  _cache = {};
  _gps: any = null;
  _proxyPort: number | null = null;

  constructor({ proxyPort }) {
    console.log("creating stackframeresolver", proxyPort);
    this._proxyPort = proxyPort;
    this._gps = new StackTraceGPS({ ajax: this._ajax.bind(this) });
  }

  _ajax(url) {
    return new Promise((resolve, reject) => {
      var r = request.defaults({
        proxy: "http://127.0.0.1:" + this._proxyPort
      });
      r(
        {
          url,
          rejectUnauthorized: false // fix UNABLE_TO_VERIFY_LEAF_SIGNATURE when loading trello board
        },
        function(err, res, body) {
          if (err) {
            console.error("request source maping error", err, url);
          } else {
            resolve(body);
          }
        }
      );
    });
  }

  resolveSourceCode(frameObject) {
    return this._fetchCode(frameObject).then(code => {
      return getSourceCodeObject(frameObject, code);
    });
  }

  _fetchCode(frameObject) {
    return this._gps.ajax(frameObject.fileName);
  }

  resolveFrameFromLoc(loc) {
    const frameObject: any = {};
    frameObject.fileName = loc.url + "?dontprocess";
    frameObject.lineNumber = loc.start.line;
    frameObject.columnNumber = loc.start.column;
    return this.resolveSourceCode(frameObject).then(code => {
      frameObject.code = code;
      // frameObject.__debugOnly_FrameString = frameString;
      return Promise.resolve(frameObject);
    });
  }

  _resolveFrame(frameString, prettify) {
    return new Promise<ResolvedStackFrame>((resolve, reject) => {
      var cacheKey = frameString + (prettify ? "Pretty" : "Nonpretty");
      if (this._cache[cacheKey]) {
        return resolve(this._cache[cacheKey]);
      }

      var frameObject = ErrorStackParser.parse({ stack: frameString })[0];

      const finish = (frame: ResolvedStackFrame) => {
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
              newFrame.__debugOnly_FrameString = frameString;
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
        function() {
          console.log("Pinpoint failed!", arguments);
          reject("pinpoint failed");
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

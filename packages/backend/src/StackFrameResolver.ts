import { prettifyAndMapFrameObject } from "./prettify";

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

class StackFrameResolver {
  _cache = {};
  _gps: any = null;
  _nonProxyGps: any = null;
  _proxyPort: number | null = null;
  _sourceObjectUrlCache = {};

  constructor({ proxyPort }) {
    this._proxyPort = proxyPort;
    this._gps = new StackTraceGPS({ ajax: this.getAjax("proxy") });
    this._nonProxyGps = new StackTraceGPS({ ajax: this.getAjax("normal") });
  }

  getAjax(type: "proxy" | "normal") {
    const ajax = url => {
      if (
        type === "normal" &&
        url.includes("http://fromjs-temporary-url.com:5555")
      ) {
        // We use this port for eval scripts, which are only available through the proxy
        return this._gps._get(url);
      }
      return new Promise((resolve, reject) => {
        const options: any = {};
        if (type === "proxy") {
          options.proxy = "http://127.0.0.1:" + this._proxyPort;
        }

        var r = request.defaults(options);
        r(
          {
            url,
            rejectUnauthorized: false // fix UNABLE_TO_VERIFY_LEAF_SIGNATURE when loading trello board
          },
          function(err, res, body) {
            if (err) {
              console.error("request source maping error", err, url);
              reject(err);
            } else {
              resolve(body);
            }
          }
        );
      });
    };

    return ajax.bind(this);
  }

  resolveSourceCode(frameObject, options = { prettify: false }) {
    const { prettify } = options;
    return this._fetchCode(frameObject).then(async code => {
      if (prettify) {
        const {
          formatted,
          mappedFrameObject
        } = await prettifyAndMapFrameObject(code, frameObject);
        frameObject = mappedFrameObject;
        code = formatted;
      }
      return this.getSourceCodeObject(frameObject, code);
    });
  }

  _fetchCode(frameObject) {
    return this._gps._get(frameObject.fileName);
  }

  getSourceCodeObject(frameObject, code) {
    function makeLine(fullLine, focusColumn) {
      try {
        var text = fullLine;
        var firstCharIndex = 0;
        var lastCharIndex = fullLine.length;
        if (fullLine.length > 300) {
          firstCharIndex = focusColumn - 100;
          if (firstCharIndex < 0) {
            firstCharIndex = 0;
          }
          lastCharIndex = firstCharIndex + 200;
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
          text: err.toString()
        };
      }
    }

    // Make it possible to look up full source code
    // Easy to do it this way but pretty inelegant because
    // - it duplicates the cache data (though probably not taking much extra space)
    // - it only works if you first resolve a frame
    this._sourceObjectUrlCache[frameObject.fileName] = code;

    var lines = code.split("\n");

    if (!lines[frameObject.lineNumber - 1]) {
      console.log(
        "line doesn't exist - maybe because the frame being mapped is inside init.js and doesn't map anywhere?"
      );
    }

    const NUMBER_OF_LINES_TO_LOAD = 20;

    return {
      line: makeLine(
        lines[frameObject.lineNumber - 1],
        frameObject.columnNumber
      ),
      previousLines: lines
        .slice(
          Math.max(frameObject.lineNumber - 1 - NUMBER_OF_LINES_TO_LOAD, 0),
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

  getFullSourceCode(url) {
    let res = this._sourceObjectUrlCache[url];
    if (res === undefined) {
      res = this._sourceObjectUrlCache[url + "?dontprocess"];
    }
    if (res === undefined) {
      throw Error("url not found in cache");
    }
    return res;
  }

  resolveFrameFromLoc(loc, prettifyIfNoSourceMap) {
    const frameObject: any = {};
    frameObject.fileName = loc.url + "?dontprocess";
    frameObject.lineNumber = loc.start.line;
    frameObject.columnNumber = loc.start.column;

    // copied from stacktrace-gps
    function _findSourceMappingURL(source) {
      var sourceMappingUrlRegExp = /\/\/[#@] ?sourceMappingURL=([^\s'"]+)\s*$/gm;
      var lastSourceMappingUrl;
      var matchSourceMappingUrl;
      while ((matchSourceMappingUrl = sourceMappingUrlRegExp.exec(source))) {
        // jshint ignore:line
        lastSourceMappingUrl = matchSourceMappingUrl[1];
      }
      if (lastSourceMappingUrl) {
        return lastSourceMappingUrl;
      } else {
        throw new Error("sourceMappingURL not found");
      }
    }

    return new Promise(resolve => {
      // Currently only supports the happy path, and assumes
      // sourcemap uses sourcescontent instead of URL refs

      const finishWithoutSourceMaps = () => {
        return this.resolveSourceCode(frameObject, {
          prettify: prettifyIfNoSourceMap
        }).then(code => {
          frameObject.code = code;
          // frameObject.__debugOnly_FrameString = frameString;
          resolve(frameObject);
        });
      };

      if (
        !frameObject.fileName.includes("http://fromjs-temporary-url.com:5555/")
      ) {
        this._nonProxyGps
          .pinpoint(frameObject)
          .then(pinpointedFrameObject => {
            return this._nonProxyGps
              ._get(frameObject.fileName)
              .then(unSourcemappedCode => {
                let smUrl = _findSourceMappingURL(unSourcemappedCode);
                if (!(smUrl.includes("http") || smUrl.includes("https"))) {
                  const basePath = frameObject.fileName
                    .split("/")
                    .slice(0, -1)
                    .join("/");
                  smUrl = basePath + "/" + smUrl;
                }
                return this._nonProxyGps.sourceMapConsumerCache[smUrl].then(
                  smConsumer => {
                    const sourcesIndex = smConsumer.sources.indexOf(
                      pinpointedFrameObject.fileName
                    );
                    const code = smConsumer.sourcesContent[sourcesIndex];

                    pinpointedFrameObject.code = this.getSourceCodeObject(
                      pinpointedFrameObject,
                      code
                    );
                    resolve(pinpointedFrameObject);
                  }
                );
              });
          })
          .catch(err => {
            finishWithoutSourceMaps();
          });
      } else {
        finishWithoutSourceMaps();
      }
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

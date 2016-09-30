var endsWith = require("ends-with")
var StackTraceGPS = require("./stacktrace-gps")
var ErrorStackParser = require("./error-stack-parser")
import _ from "underscore"

export default class FrameResolver {
    constructor(ajax){
        this._gps = new StackTraceGPS({ajax: ajax});;
        this._resolvedFrameCache = {}
        this._frameStringsCurrentlyBeingResolved = {}
    }
    _addCodeToFrame(frameObject, callback){
        this._gps._get(frameObject.fileName).then(function(src){
            var lines = src.split("\n")
            var zeroIndexedLineNumber = frameObject.lineNumber - 1;
            frameObject = {...frameObject}
            frameObject.prevLines = lines.slice(0, zeroIndexedLineNumber)
            frameObject.line = lines[zeroIndexedLineNumber];
            frameObject.nextLines = lines.slice(zeroIndexedLineNumber + 1)

            if (frameObject.line === undefined) {
                debugger
            }

            callback(null, frameObject)
        })
    }
    resolve(frameString, callback){
        // console.time("Resolve Frame " + frameString)
        var self = this;
        if (this._resolvedFrameCache[frameString]){
            done([null, this._resolvedFrameCache[frameString]])
            return
        }

        var isCanceled = false

        var frameObject = ErrorStackParser.parse({stack: frameString})[0];

        if (endsWith(frameObject.fileName, ".html")){
            // don't bother looking for source map file
            frameObject.fileName += ".dontprocess"
            this._addCodeToFrame(frameObject, callback)
        } else {
            // Use promises so we can re-use them, so if the same frame is requested again
            // before the first one succeeded we don't attempt to resolve again
            if (self._frameStringsCurrentlyBeingResolved[frameString]) {
                self._frameStringsCurrentlyBeingResolved[frameString].then(done)
            } else {
                self._frameStringsCurrentlyBeingResolved[frameString] = new Promise(function(resolve, reject){
                    self._gps.pinpoint(frameObject).then(function(newFrame){
                        self._addCodeToFrame(newFrame, function(err, frame){
                            resolve([err, frame])
                        })
                    }, function(){
                        self._addCodeToFrame(frameObject, function(err, frame){
                            resolve([err, frame])
                        })
                        console.log("error", arguments)
                    });
                })

                self._frameStringsCurrentlyBeingResolved[frameString].then(done)
            }
        }

        function done(args){
            var [err, frame] = args
            // console.timeEnd("Resolve Frame " + frameString)
            delete self._frameStringsCurrentlyBeingResolved[frameString]

            self._resolvedFrameCache[frameString] = frame
            if (!isCanceled) {
                callback(err, frame)
            }
        }

        return function cancel(){
            isCanceled = true;
        }
    }
    addFilesToCache(files){
        this._gps.sourceCache = _.extend(this._gps.sourceCache, files)
    }
    getSourceFileContent(filePath, callback){
        this._gps._get(filePath).then(function(src){
            callback(src)
        })
    }
}

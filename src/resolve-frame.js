var endsWith = require("ends-with")
var StackTraceGPS = require("./stacktrace-gps")
var ErrorStackParser = require("./error-stack-parser")
import _ from "underscore"

var gps = new StackTraceGPS({});;
var resolvedFrameCache = {}

function resFrame(frame, callback){
    gps._get(frame.fileName).then(function(src){
        var lines = src.split("\n")
        var zeroIndexedLineNumber = frame.lineNumber - 1;
        frame = {...frame}
        frame.prevLines = lines.slice(0, zeroIndexedLineNumber)
        frame.line = lines[zeroIndexedLineNumber];
        frame.nextLines = lines.slice(zeroIndexedLineNumber + 1)

        if (frame.line === undefined) {
            debugger
        }

        callback(null, frame)
    })
}

var frameStringsCurrentlyBeingResolved = {}

export function addFilesToCache(files){
    console.log("ADD FILES TO CACHE", files)
    gps.sourceCache = _.extend(gps.sourceCache, files)
    console.log("SOURCE CACHE IS", gps.sourceCache)
}

function resolveFrame(frameString, callback){
    // console.time("Resolve Frame " + frameString)
    if (resolvedFrameCache[frameString]){
        done([null, resolvedFrameCache[frameString]])
        return
    }

    var isCanceled = false

    var frameObject = ErrorStackParser.parse({stack: frameString})[0];

    if (endsWith(frameObject.fileName, ".html")){
        // don't bother looking for source map file
        frameObject.fileName += ".dontprocess"
        resFrame(frameObject, callback)
    } else {
        // Use promises so we can re-use them, so if the same frame is requested again
        // before the first one succeeded we don't attempt to resolve again
        if (frameStringsCurrentlyBeingResolved[frameString]) {
            frameStringsCurrentlyBeingResolved[frameString].then(done)
        } else {
            frameStringsCurrentlyBeingResolved[frameString] = new Promise(function(resolve, reject){
                console.log("SOURCE CACHE", gps.sourceCache)

                gps.pinpoint(frameObject).then(function(newFrame){
                    resFrame(newFrame, function(err, frame){
                        resolve([err, frame])
                    })
                }, function(){
                    resFrame(frameObject, function(err, frame){
                        resolve([err, frame])
                    })
                    console.log("error", arguments)
                });
            })

            frameStringsCurrentlyBeingResolved[frameString].then(done)
        }
    }

    function done(args){
        var [err, frame] = args
        // console.timeEnd("Resolve Frame " + frameString)
        delete frameStringsCurrentlyBeingResolved[frameString]

        resolvedFrameCache[frameString] = frame
        if (!isCanceled) {
            callback(err, frame)
        }
    }

    return function cancel(){
        isCanceled = true;
    }
}

export default resolveFrame

export function getSourceFileContent(filePath, callback){
    gps._get(filePath).then(function(src){
        callback(src)
    })
}

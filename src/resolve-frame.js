var endsWith = require("ends-with")
var StackTraceGPS = require("./stacktrace-gps")
var ErrorStackParser = require("./error-stack-parser")
import _ from "underscore"

var gps = null;
var defaultSourceCache = null
var resolvedFrameCache = {}

function resFrame(frame, callback){
    gps._get(frame.fileName).then(function(src){
        var lines = src.split("\n")
        var zeroIndexedLineNumber = frame.lineNumber - 1;
        frame = {...frame}
        frame.prevLines = lines.slice(0, zeroIndexedLineNumber)
        frame.line = lines[zeroIndexedLineNumber];
        frame.nextLines = lines.slice(zeroIndexedLineNumber + 1)

        callback(null, frame)
    })

}

window.setDefaultSourceCache = setDefaultSourceCache
export function setDefaultSourceCache(sourceCache){
    defaultSourceCache = _.clone(sourceCache)
}

export function getDefaultSourceCache(){
    if (defaultSourceCache !== null) {
        return defaultSourceCache
    }

    var sourceCache = {};
    for (var filename in fromJSDynamicFiles){
        sourceCache[filename] = fromJSDynamicFiles[filename]
    }

    return sourceCache
}

function initGPSIfNecessary(){
    if (gps !== null) return

    gps = new StackTraceGPS({sourceCache: getDefaultSourceCache()});
    window.gps = gps
}

export default function(frameString, callback){
    // console.time("Resolve Frame " + frameString)
    if (resolvedFrameCache[frameString]){
        done(null, resolvedFrameCache[frameString])
        return
    }

    var isCanceled = false

    initGPSIfNecessary()

    var frameObject = ErrorStackParser.parse({stack: frameString})[0];

    if (endsWith(frameObject.fileName, ".html")){
        // don't bother looking for source map file
        frameObject.fileName += "?dontprocess=yes"
        resFrame(frameObject, callback)
    } else {
        gps.pinpoint(frameObject).then(function(newFrame){
            resFrame(newFrame, function(err, frame){
                done(err, frame)
            })
        }, function(){
            resFrame(frameObject, function(err, frame){
                done(err, frame)
            })
            console.log("error", arguments)
        });
    }

    function done(err, frame){
        // console.timeEnd("Resolve Frame " + frameString)
        resolvedFrameCache[frameString] = frame
        if (!isCanceled) {
            callback(err, frame)
        }
    }

    return function cancel(){
        isCanceled = true;
    }
}

export function getSourceFileContent(filePath, callback){
    gps._get(filePath).then(function(src){
        callback(src)
    })
}

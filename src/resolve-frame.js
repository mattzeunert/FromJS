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
        frame.prevLine = lines[frame.lineNumber - 1 - 1]// adjust for lines being one-indexed
        frame.nextLine = lines[frame.lineNumber + 1 - 1]
        frame.line = lines[frame.lineNumber - 1];

        callback(null, JSON.parse(JSON.stringify(frame)))
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

    initGPSIfNecessary()

    var frameObject = ErrorStackParser.parse({stack: frameString})[0];

    if (endsWith(frameObject.fileName, ".html")){
        // don't bother looking for source map file
        resFrame(frameObject, callback)
    } else {
        gps.pinpoint(frameObject).then(function(newFrame){
            resFrame(newFrame, function(err, frame){
                done(err, frame)
            })
        }, function(){
            resFrame(frameObject, function(err, callback){
                console.timeEnd("Resolve Frame " + frameString)
                done(err, frame)
            })
            console.log("error", arguments)
        });
    }

    function done(err, frame){
        // console.timeEnd("Resolve Frame " + frameString)
        resolvedFrameCache[frameString] = frame
        callback(err, frame)
    }
}

export function getSourceFileContent(filePath, callback){
    gps._get(filePath).then(function(src){
        callback(src)
    })
}

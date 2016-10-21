import FrameResolver from "./resolve-frame"
import RoundTripMessageWrapper from "./RoundTripMessageWrapper"

var wrapper = new RoundTripMessageWrapper(self, "ResolveFrameWorker")
var frameResolver = new FrameResolver(function ajax(url){
    return new Promise(function(resolve, reject){
        wrapper.send("fetchUrl", url , function(text){
            resolve(text)
        });
    })
});


wrapper.on("resolveFrame", function(frameString, callback){
    frameResolver.resolve(frameString, function(err, res){
        callback(err, res)
    })
})

wrapper.on("registerDynamicFiles", function(files, callback){
    frameResolver.addFilesToCache(files)
    callback()
})

wrapper.on("getSourceFileContent", function(path, callback){
    frameResolver.getSourceFileContent(path, callback)
})

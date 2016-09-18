import resolveFrame, {getCodeFilePath, addFilesToCache, getSourceFileContent} from "./resolve-frame"
import RoundTripMessageWrapper from "./RoundTripMessageWrapper"

var callback
onmessage = function(){
    callback.apply(this, arguments)
}
function setHandler(cb){
    callback = cb
}
var wrapper = new RoundTripMessageWrapper(setHandler, function(){
    postMessage.apply(null, arguments)
})

wrapper.on("resolveFrame", function(frameString, callback){
    resolveFrame(frameString, function(err, res){
        callback(err, res)
    })
})

wrapper.on("registerDynamicFiles", function(files, callback){
    addFilesToCache(files)
    callback()
})

wrapper.on("getSourceFileContent", function(path, callback){
    getSourceFileContent(path, callback)
})

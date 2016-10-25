import fileIsDynamicCode from "../fileIsDynamicCode"

export default function getCodeFilePath(filename, callback, resolveFrameWorker){
    var isCanceled = false

    if (fileIsDynamicCode(filename)){
        // dynamic function doesn't exist on server (created with eval/new Function)
        // so get the cached version
        resolveFrameWorker.send("getSourceFileContent", filename, function(src){
            if (!isCanceled) {
                callback(URL.createObjectURL(new Blob([src]), {type: "text/plain"}))
            }
        })
    }
    else {
        setTimeout(function(){
            if (!isCanceled){
                // replacing .dontprocess means the local server
                // will still serve the processed file,
                // but with the extension FromJS won't be enabled in the new tab
                filename = filename.replace(".dontprocess", "")
                callback(filename)
            }
        })
    }

    return function cancel(){
        isCanceled = true
    }
}

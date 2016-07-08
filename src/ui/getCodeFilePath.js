import {getSourceFileContent} from "../resolve-frame"
import fileIsDynamicCode from "../fileIsDynamicCode"

export default function getCodeFilePath(filename, callback){
    // always use data URL, rather than linking to file directly
    // this means you can't get the correct file path any more, which sucks
    // but otherwise the links in the demo would be broken or require custom logic
    getSourceFileContent(filename, function(src){
        callback(URL.createObjectURL(new Blob([src]), {type: "text/plain"}))
    })
    // if (fileIsDynamicCode(filename)){
    //     // dynamic function doesn't exist on server (created with eval/new Function)
    //     // so get the cached version
    //     getSourceFileContent(filename, function(src){
    //        callback(URL.createObjectURL(new Blob([src]), {type: "text/plain"}))
    //     })
    // }
    // else {
    //     setTimeout(function(){
    //         filename = filename.replace("http://localhost:8888/", "")
    //         callback(filename)
    //     })
    // }
}

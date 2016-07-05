import {getSourceFileContent} from "../resolve-frame"
import fileIsDynamicCode from "../fileIsDynamicCode"

export default function getCodeFilePath(filename, callback){
    if (fileIsDynamicCode(filename)){
        // dynamic function doesn't exist on server (created with eval/new Function)
        // so get the cached version
        getSourceFileContent(filename, function(src){
            callback("data:text/plain;charset=UTF-8;base64," + btoa(src))
        })
    }
    else {
        setTimeout(function(){
            callback(filename)
        })
    }

}

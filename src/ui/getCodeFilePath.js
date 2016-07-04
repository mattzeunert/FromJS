import {getSourceFileContent} from "../resolve-frame"
var stringContains = require("string-contains");

export default function getCodeFilePath(filename, callback){
    if (stringContains(filename, "DynamicFunction")){
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

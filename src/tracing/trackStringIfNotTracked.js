import untrackedString from "./untrackedString"
import untrackedNumber from "./untrackedNumber"
import _ from "underscore"
import makeGetErrorFunction from "./makeGetErrorFunction"

export default function trackStringIfNotTracked(str, err){
    if (str.isStringTraceString) {
        return str
    }
    if (typeof str === "number"){
        return untrackedNumber(str, err)
    }
    if (_.isArray(str)) {
        return str.join()
    } else {
        return untrackedString(str, err)
    }
}

// re-uses error object
export function makeTrackIfNotTrackedFunction(){
    var getError = makeGetErrorFunction();
    var fn = function(str){
        if(str === null){
            str = "null"
        }
        if(str === undefined){
            str = "undefined"
        }
        return trackStringIfNotTracked(str, fn.getErrorObject())
    }
    fn.getErrorObject = function(){
        return getError();
    }

    return fn;
}

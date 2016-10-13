import untrackedString from "./untrackedString"
import untrackedNumber from "./untrackedNumber"
import _ from "underscore"

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
    var err = null;
    var fn = function(str){
        return trackStringIfNotTracked(str, fn.getErrorObject())
    }
    fn.getErrorObject = function(){
        if (err === null) {
            err = Error()
        }
        return err;
    }

    return fn;
}

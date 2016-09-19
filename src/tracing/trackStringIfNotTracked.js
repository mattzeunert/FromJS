import untrackedString from "./untrackedString"
import untrackedNumber from "./untrackedNumber"
import _ from "underscore"

export default function(str){
    if (str.isStringTraceString) {
        return str
    }
    if (typeof str === "number"){
        return untrackedNumber(str)
    }
    if (_.isArray(str)) {
        return str.join()
    } else {
        return untrackedString(str)
    }
}

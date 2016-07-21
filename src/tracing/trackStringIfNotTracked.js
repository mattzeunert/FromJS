import untrackedString from "./untrackedString"

export default function(str){
    if (str.isStringTraceString) {
        return str
    }
    return untrackedString(str)
}

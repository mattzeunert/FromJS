import Origin from "../origin"
import {makeTraceObject} from "./FromJSString"
import config from "../config"

export default function untrackedString(arg){
    if (config.logUntrackedStrings) {
        console.trace("untracked argument", arg)
    }
    return makeTraceObject({
        value: arg,
        origin: new Origin({
            action: "Untracked Argument",
            value: arg.toString(),
            inputValues: []
        })
    })
}
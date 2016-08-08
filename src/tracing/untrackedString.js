import Origin from "../origin"
import {makeTraceObject} from "./FromJSString"
import config from "../config"

export default function untrackedString(value){
    if (config.logUntrackedStrings) {
        console.trace("untrackedString", value)
    }
    return makeTraceObject({
        value: value,
        origin: new Origin({
            action: "Untracked String",
            value: value,
            inputValues: []
        }),
    })
}

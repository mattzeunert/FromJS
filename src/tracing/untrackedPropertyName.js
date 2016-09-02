import Origin from "../origin"
import {makeTraceObject} from "./FromJSString"
import config from "../config"

export default function untrackedString(value){
    if (config.logUntrackedPropertyNames) {
        console.trace("property name not tracked", value)
    }
    return makeTraceObject({
        value: value,
        origin: new Origin({
            action: "Untracked Property Name",
            value: value,
            inputValues: []
        }),
    })
}

import Origin from "../origin"
import {makeTraceObject} from "./FromJSString"
import config from "../config"

export default function untrackedString(value, /*optional*/ error){
    return makeTraceObject({
        value: value,
        origin: new Origin({
            action: "Untracked Number",
            value: value,
            inputValues: [],
            error
        }),
    })
}

import Origin from "../origin"
import {makeTraceObject} from "./FromJSString"

export default function untrackedString(value){
    return makeTraceObject({
        value: value,
        origin: new Origin({
            action: "Untracked Property Name",
            value: value,
            inputValues: []
        }),
    })
}

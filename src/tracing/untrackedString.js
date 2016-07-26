import Origin from "../origin"
import makeTraceObject from "./makeTraceObject"

export default function untrackedString(value){
    console.trace("untrackedString", value)
    return makeTraceObject({
        value: value,
        origin: new Origin({
            action: "Untracked String",
            value: value,
            inputValues: []
        }),
    })
}

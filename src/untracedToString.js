export default function untracedToString(val, allowUndefinedAndNull){
    if (allowUndefinedAndNull) {
        // allowUndefinedAndNull is false by default, so the behavior of
        // untracedToString is same as val.toString,
        // which throws on undefined/null
        if (val === undefined) {
            return "undfined"
        }
        if (val === null) {
            return "null"
        }
    }

    var ret;
    if (val.isStringTraceString) {
        ret = val.toString();
    }
    else if (typeof val === "number") {
        ret = nativeNumberToString.apply(val)
    }
    else if (typeof val === "object"){
        if (val.toString === Object.prototype.toString) {
            ret = nativeObjectToString.apply(val)
        } else {
            // object has custom toString method, or it's an array or similar
            ret = val.toString()
            if (typeof ret !== "string") {
                ret = ret.value
            }
        }
    }
    else {
        ret = val.toString()
    }

    if (process.env.NODE_ENV !== "production") {
        if (typeof ret !== "string"){
            console.warn("untracedToString returned traced value!")
        }
    }

    return ret;
}

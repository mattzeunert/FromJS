export default function untracedToString(val){
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
            // object has custom toString method
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

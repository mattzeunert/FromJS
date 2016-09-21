export default function untracedToString(val){
    var ret;
    if (val.isStringTraceString) {
        ret = val.toString();
    }
    else if (typeof val === "number") {
        ret = nativeNumberToString.apply(val)
    }
    else if (typeof val === "object"){
        ret = nativeObjectToString.apply(val)
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

import stringTraceUseValue from "./stringTraceUseValue"

export default function unstringTracifyArguments(argumentsFromOtherFn){
    var args = []
    for (var i=0;i<argumentsFromOtherFn.length; i++) {
        args.push(stringTraceUseValue(argumentsFromOtherFn[i]))
    }
    return args
}

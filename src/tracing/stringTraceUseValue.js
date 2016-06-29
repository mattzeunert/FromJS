export default function stringTraceUseValue(a){
    if (a && a.isStringTraceString) {
        return a.toString()
    }
    return a;
}

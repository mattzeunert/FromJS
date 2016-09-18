import RoundTripMessageWrapper from "./RoundTripMessageWrapper"

var resolveFrameWorker = null;

export default function getResolveFrameWorker(){
    if (resolveFrameWorker === null){
        var webWorkerInstance = new Worker("/fromjs-internals/resolveFrameWorker.js")
        resolveFrameWorker = new RoundTripMessageWrapper(webWorkerInstance)
    }
    return resolveFrameWorker
}

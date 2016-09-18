import RoundTripMessageWrapper from "./RoundTripMessageWrapper"

var resolveFrameWorker = null;


export default function getResolveFrameWorker(){
    if (resolveFrameWorker === null){
        var workerURL = "/fromjs-internals/resolveFrameWorker.js"
        if (window.fromJSResolveFrameWorkerCode) {
            // Load as string from background page, because
            // you can't load a Worker from a chrome-extension:// URL directly
            workerURL = URL.createObjectURL(new Blob([window.fromJSResolveFrameWorkerCode]))
        }
        var webWorkerInstance = new Worker(workerURL)
        resolveFrameWorker = new RoundTripMessageWrapper(webWorkerInstance)
    }
    return resolveFrameWorker
}

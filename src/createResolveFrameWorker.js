import RoundTripMessageWrapper from "./RoundTripMessageWrapper"

export default function createResolveFrameWorker(){
    var workerURL = "/fromjs-internals/resolveFrameWorker.js"
    if (window.fromJSResolveFrameWorkerCode) {
        // Load as string from background page, because
        // you can't load a Worker from a chrome-extension:// URL directly
        workerURL = URL.createObjectURL(new Blob([window.fromJSResolveFrameWorkerCode]))
    }
    var webWorkerInstance = new Worker(workerURL)
    return new RoundTripMessageWrapper(webWorkerInstance, "Inspected App/ResolveFrameWorker")
}

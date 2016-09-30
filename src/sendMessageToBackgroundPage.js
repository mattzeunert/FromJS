export default function sendMessageToBackgroundPage(data, callback){
    // this file is included by multiple bundles, so _.uniqueId() won't be
    // unique across bundles
    var id = Math.random().toString().slice(2)
    var callbackName = "fromJSBackgroundMessageCallback" + id
    window[callbackName] = function(argsString){
        delete window[callbackName];
        if (window.fromJSDisableTracing) {
            window.fromJSDisableTracing()
        }
        var args = JSON.parse(argsString)
        if (window.fromJSEnableTracing) {
            window.fromJSEnableTracing();
        }
        callback.apply(this, args);
    }
    data.callbackName = callbackName;

    data.isFromJSExtensionMessage = true
    var event = new CustomEvent("RebroadcastExtensionMessage", {detail: data});
    window.dispatchEvent(event);
}

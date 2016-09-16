import _ from "underscore"
import config from "../config"

export default function InspectedPage(iframe){
    this._handlers = {}
    this._iframe = iframe

    this._onMessage = function(e){
        var data = e.data;

        if (!data.isFromJSMessage) {
            return
        }

        var timeWhenSent = new Date(data.sentAt)
        var timeTaken = new Date().valueOf() - timeWhenSent.valueOf()

        var eventData = data.eventData
        var eventType = data.eventType
        if (config.logReceivedInspectorMessages) {
            console.log("Received", eventType,"took", timeTaken, "ms", eventData)
        }

        var handlers = this._handlers[eventType];
        if (!handlers) {
            handlers = [];
        }

        // set timeout for testing flicker/ behavior of UI
        // setTimeout(function(){
            handlers.forEach(function(handler){
                handler.apply(null, eventData)
            })
        // }, 500)


    }
    this._onMessage = this._onMessage.bind(this)

    console.log("Adding event listener, make sure to close this InspectedPage when it's no longer used")
    window.addEventListener("message", this._onMessage)
}

InspectedPage.prototype.on = function(event, handler){
    if (!this._handlers[event]) {
        this._handlers[event] = [];
    }
    this._handlers[event].push(handler)
}
InspectedPage.prototype.trigger = function(event){
    if (this._closed) {return}

    var target = window.parent
    if (this._iframe) {
        target = this._iframe.contentWindow;
    }

    var args = Array.from(arguments);
    var eventType = args.shift();

    target.postMessage({
        isFromJSMessage: true,
        sentAt: new Date(),
        eventType: eventType,
        // Avoid stringificaiton here, improve perf in future
        eventData: JSON.parse(JSON.stringify(args))
    }, location.href)
}
InspectedPage.prototype.close = function(event){
    this._closed = true;
    window.removeEventListener("message", this.onMessage)
}

function addCancelableCallbackRequest(makeRequestName, onRequestName, cacheResponses) {
    var cacheName = null;
    if (cacheResponses) {
        cacheName = onRequestName + "_cache"
        InspectedPage[cacheName] = {}
    }
    function setCache(key, value){
        InspectedPage[cacheName][JSON.stringify(key)] = value
    }
    function getCache(key){
        return InspectedPage[cacheName][JSON.stringify(key)]
    }
    InspectedPage.prototype[makeRequestName] = function(){
        var args = Array.from(arguments)
        var callback = args[args.length - 1]
        args = args.slice(0, -1)

        if (cacheResponses) {
            var cachedValue = getCache(args)
            if (cachedValue) {
                callback.apply(null, cachedValue)
                return
            }
        }

        var id = _.uniqueId()
        var canceled = false;
        this.on(makeRequestName + id + "Complete", function(){
            if (canceled) {return}
            if (cacheResponses) {
                setCache(args, arguments)
            }
            callback.apply(null, arguments)
        })
        this.trigger(makeRequestName, args, id)

        return function cancel(){
            canceled = true;
        }
    }
    InspectedPage.prototype[onRequestName] = function(callback){
        var self = this;
        this.on(makeRequestName, function(args, id){
            args = [...args, function(){
                var args = Array.from(arguments)
                args.unshift(makeRequestName + id + "Complete")
                self.trigger.apply(self, args)
            }]
            callback.apply(null, args)
        })
    }
}

addCancelableCallbackRequest("getRootOriginAtChar", "onGetRootOriginAtCharRequest")
// We want a local cache for resolve frame so results are returned synchronously
// Otherwise there's a small flicker every time you hover over a character
addCancelableCallbackRequest("resolveFrame", "onResolveFrameRequest", true)
addCancelableCallbackRequest("whereDoesCharComeFrom", "onWhereDoesCharComeFromRequest")
addCancelableCallbackRequest("getCodeFilePath", "onGetCodeFilePathRequest", true)

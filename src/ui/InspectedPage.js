import _ from "underscore"
import config from "../config"

export default function InspectedPage(iframe){
    this._handlers = {}
    this._iframe = iframe

    this._onMessage = function(e){
        var data = e.data;

        var sizeInKB = Math.round(data.length / 1024)
        data = JSON.parse(data)

        var eventType = data.shift();
        var timeWhenSent = new Date(data.pop())
        var timeTaken = new Date().valueOf() - timeWhenSent.valueOf()
        if (config.logReceivedInspectorMessages) {
            console.log("Received", eventType, "Size", sizeInKB, "KB","took", timeTaken, "ms")
        }

        var handlers = this._handlers[eventType];
        if (!handlers) {
            handlers = [];
        }
        handlers.forEach(function(handler){
            handler.apply(null, data)
        })

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
    var target = window.parent
    if (this._iframe) {
        target = this._iframe.contentWindow;
    }

    var args = Array.from(arguments);
    args.push(new Date())

    target.postMessage(JSON.stringify(args), location.href)
}
InspectedPage.prototype.close = function(event){
    window.removeListener("message", this.onMessage)
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

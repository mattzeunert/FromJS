import _ from "underscore"

export default function InspectedPage(iframe){
    this._handlers = {}
    this._iframe = iframe

    this._onMessage = function(e){
        var data = e.data;

        data = JSON.parse(data)

        var eventType = data.shift();

        var handlers = this._handlers[eventType];
        if (!handlers) {
            handlers = [];
        }
        handlers.forEach(function(handler){
            handler.apply(null, data)
        })
        console.log("handling", "eventtype", "message", arguments)
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

    console.log("triggering", event, "on", target)

    target.postMessage(JSON.stringify(Array.from(arguments)), location.href)
}
InspectedPage.prototype.close = function(event){
    window.removeListener("message", this.onMessage)
}

function addCancelableCallbackRequest(makeRequestName, onRequestName) {
    InspectedPage.prototype[makeRequestName] = function(){
        var args = Array.from(arguments)
        var callback = args[args.length - 1]
        args = args.slice(0, -1)

        var id = _.uniqueId()
        var canceled = false;
        this.on(makeRequestName + id + "Complete", function(){
            if (canceled) {return}
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
addCancelableCallbackRequest("resolveFrame", "onResolveFrameRequest")
addCancelableCallbackRequest("whereDoesCharComeFrom", "onWhereDoesCharComeFromRequest")
addCancelableCallbackRequest("getCodeFilePath", "onGetCodeFilePathRequest")

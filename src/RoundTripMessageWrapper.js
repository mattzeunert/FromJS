import _ from "underscore"

export default class RoundTripMessageWrapper {
    constructor(target) {
        var onMessage, postMessage, targetHref;

        var userPassedInFunctions = target.onMessage && target.postMessage
        var targetIsWorkerGlobalScope = typeof DedicatedWorkerGlobalScope !== "undefined" &&
            target instanceof DedicatedWorkerGlobalScope;
        var targetIsWebWorker = typeof Worker !== "undefined" && target instanceof Worker
        // do this rather than `instanceof Window` because sometimes the constructor is a different
        // `Window` object I think (probalby the Window object of the parent frame)
        var targetIsWindow = target.constructor.toString().indexOf("function Window() { [native code] }") !== -1
        var targetIsIFrame = typeof HTMLIFrameElement !== "undefined" && target instanceof HTMLIFrameElement
        if (userPassedInFunctions) {
            onMessage = target.onMessage;
            postMessage = target.postMessage
        } else if (targetIsWorkerGlobalScope) {
            onMessage = function(callback){
                target.addEventListener("message", callback)
            }
            postMessage = function(){
                target.postMessage.apply(null, arguments)
            }
        } else if (targetIsWebWorker){
            onMessage = function(callback){
                target.onmessage = callback
            }
            postMessage = function(){
                target.postMessage.apply(target, arguments)
            }
        } else if (targetIsWindow) {
            targetHref = target.location.href
            onMessage = function(callback){
                window.addEventListener("message", callback)
            }
            postMessage = function(){
                target.postMessage.apply(target, arguments)
            }
        } else {
            throw Error("Unknown RoundTripMessageWrapper target")
        }

        this.argsForDebugging = arguments
        onMessage((e) => this._handle(e.data))
        this._targetHref = targetHref
        this._postMessage = function(data){
            console.log("postMessage", data)

            // necessary for some reason, but may not be great for perf
            data = JSON.parse(JSON.stringify(data))
            postMessage(data, targetHref)
        }
        this._handlers = {}
    }
    _handle(data){
        if (!data.isRoundTripMessage) {
            return;
        }

        var messageType = data.messageType;
        var handlers = this._handlers[messageType]
        console.log("onmessage", data, handlers)
        // debugger
        if (!handlers) {
            return;
        }

        var self = this;
        var callback = function(){
            self._postMessage({
                isRoundTripMessage: true,
                messageType: messageType + data.id,
                args: Array.from(arguments),
                isResponse: true
            })
        }

        handlers.forEach(function(handler){
            if (data.isResponse || !data.hasCallBack) {
                handler.apply(null, [...data.args])
            } else {
                handler.apply(null, [...data.args, callback])
            }

        })

    }
    on(messageType, callback){
        var handlers = this._handlers[messageType];
        if (!handlers) {
            handlers = [];
        }
        handlers.push(callback)
        this._handlers[messageType] = handlers
    }
    send(){
        var args = Array.from(arguments)
        var messageType = args.shift();
        var canceled = false;

        var callback;
        var hasCallBack = typeof _.last(args) === "function"
        if (hasCallBack) {
            callback = args.pop();
        }


        var id = _.uniqueId()

        if (hasCallBack) {
            this.on(messageType + id, function(){
                if (canceled) {
                    return
                }
                callback.apply(null, arguments)
            })
        }

        this._postMessage({
            isRoundTripMessage: true,
            messageType,
            id,
            args,
            hasCallBack
        })

        return function cancel(){
            canceled = true
        }
    }
}

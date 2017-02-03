import _ from "underscore"
import config from "./config"

/*
    Allows IFrames/WebWorkers/... to use callbacks to respond to messages they receive.

    Example:

    var wrapper = new RoundTripMessageWrapper(isPrimeChecker, "Primer Checker")
    wrapper.on("progress", function(percentageDone){
        console.log("Progress:", percentageDone)
    })
    wrapper.send("isPrime", 74978348934, function(isPrime){
        console.log("hasPrime")
    })
*/
export default class RoundTripMessageWrapper {
    /**
        @param {object} target - Object that can send and receive messages, e.g. an
            IFrame window object, a web worker, or any object with `postMessage` and
            `onMessage` functions.
        @param {string} connectionName - Connection name used for logging.
    */
    constructor(target, connectionName) {
        var {onMessage, postMessage, targetHref, close} = this.normalizeWrapperTarget(target);

        this._handle = this._handle.bind(this)
        onMessage(this._handle)
        this._connectionName = connectionName
        this._targetHref = targetHref
        this.close = close
        this._postMessage = (data) => {
            if (this.postMessageWrapper){
                this.postMessageWrapper(doPostMessage);
            } else {
                doPostMessage();
            }

            function doPostMessage(){
                data.timeSent = new Date();
                postMessage(data, targetHref)
            }
        }
        this._handlers = {}
    }
    normalizeWrapperTarget(target){
        var onMessage, close, postMessage, targetHref;

        var userPassedInFunctions = target.onMessage && target.postMessage
        var targetIsWorkerGlobalScope = typeof DedicatedWorkerGlobalScope !== "undefined" &&
            target instanceof DedicatedWorkerGlobalScope;
        var targetIsWebWorker = typeof Worker !== "undefined" && target instanceof Worker
        // do this rather than `instanceof Window` because sometimes the constructor is a different
        // `Window` object (probably the Window object of the parent frame)
        var targetIsWindow = target.constructor.toString().indexOf("function Window() { [native code] }") !== -1

        if (userPassedInFunctions) {
            onMessage = target.onMessage;
            postMessage = target.postMessage
        } else if (targetIsWorkerGlobalScope) {
            onMessage = function(callback){
                target.addEventListener("message", callback)
            }
            close = () => {
                target.removeEventListener("message", this._handle)
            }
            postMessage = function(){
                target.postMessage.apply(null, arguments)
            }
        } else if (targetIsWebWorker){
            onMessage = function(callback){
                target.onmessage = callback
            }
            close = function(){
                target.onmessage = null
            }
            postMessage = function(){
                target.postMessage.apply(target, arguments)
            }
        } else if (targetIsWindow) {
            targetHref = target.location.href
            onMessage = function(callback){
                window.addEventListener("message", callback)
            }
            close = () => {
                window.removeEventListener("message", this._handle)
            }
            postMessage = function(){
                target.postMessage.apply(target, arguments)
            }
        } else {
            throw Error("Unknown RoundTripMessageWrapper target")
        }

        return {onMessage, postMessage, close, targetHref}
    }
    _handle(e){
        var data = e.data
        if (!data.isRoundTripMessage) {
            return;
        }

        var messageType = data.messageType;
        var handlers = this._handlers[messageType]

        if (config.logReceivedInspectorMessages) {
            var timeTaken = new Date().valueOf() - new Date(data.timeSent).valueOf()
            var size = "";
            var content = "";
            // size += "Size: " + (JSON.stringify(data).length / 1024) + "KB"
            // content = data
            console.log(this._connectionName + " received", messageType, "took", timeTaken + "ms", size, content)
        }

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

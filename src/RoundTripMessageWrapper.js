import _ from "underscore"

export default class RoundTripMessageWrapper {
    constructor(maybeTarget, maybePostMessage) {
        if (typeof maybeTarget === "function") {
            var onMessage = maybeTarget;
            onMessage((e) => this._handle(e.data))

            this._postMessage = maybePostMessage
        } else {

        }
        this._handlers = {}
    }
    _handle(data){
        if (!data.isRoundTripMessage) {
            return;
        }

        var messageType = data.messageType;
        var handlers = this._handlers[messageType]
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
            if (data.isResponse) {
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
        var callback = args.pop();
        var id = _.uniqueId()

        this.on(messageType + id, function(){
            callback.apply(null, arguments)
        })

        this._postMessage({
            isRoundTripMessage: true,
            messageType,
            id,
            args
        })
    }
}

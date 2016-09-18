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
        console.log("messageType", messageType)
        var handlers = this._handlers[messageType]
        if (!handlers) {
            console.log("no handlers")
            return;
        }
        console.log("handlres", handlers)

        var self = this;
        var callback = function(){
            console.log("calling postmessage")
            self._postMessage({
                isRoundTripMessage: true,
                messageType: messageType + data.id,
                args: Array.from(arguments),
                isResponse: true
            })
        }

        handlers.forEach(function(handler){
            console.log("handler", handler, data)
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
            console.log("GOT REPLY")
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

import _ from "underscore"

export default function InspectedPage(){
    this._handlers = {}
}

InspectedPage.prototype.on = function(event, handler){
    if (!this._handlers[event]) {
        this._handlers[event] = [];
    }
    this._handlers[event].push(handler)
}
InspectedPage.prototype.trigger = function(event){
    var data = Array.from(arguments)
    data.shift();
    console.log("trigger", event, data)
    var handlers = this._handlers[event];
    if (!handlers) {
        handlers = [];
    }
    handlers.forEach(function(handler){
        handler.apply(null, data)
    })
}
InspectedPage.prototype.resolveFrame = function(frameString, callback){
    var id = _.uniqueId()
    var canceled = false;
    this.on("resolveFrame" + id + "Complete", function(){
        if (canceled) {return}
        callback.apply(null, arguments)
    })
    this.trigger("resolveFrame", frameString, id)

    return function cancel(){
        canceled = true;
    }
}
InspectedPage.prototype.onResolveFrameRequest = function(callback){
    var self = this;
    this.on("resolveFrame", function(frameString, id){
        callback(frameString, function(){
            var args = Array.from(arguments)
            args.unshift("resolveFrame" + id + "Complete")
            self.trigger.apply(self, args)
        })
    })
}

InspectedPage.getCurrentInspectedPage = function(){
    if (!InspectedPage._currentInspectedPage) {
        InspectedPage._currentInspectedPage = new InspectedPage();
    }
    return InspectedPage._currentInspectedPage
}

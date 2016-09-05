export default function InspectedPage(){
    this._handlers = {}
}

InspectedPage.prototype.on = function(event, handler){
    if (!this._handlers[event]) {
        this._handlers[event] = [];
    }
    this._handlers[event].push(handler)
}
InspectedPage.prototype.trigger = function(event, data){
    var handlers = this._handlers[event];
    if (!handlers) {
        handlers = [];
    }
    handlers.forEach(function(handler){
        handler(data)
    })
}

InspectedPage.getCurrentInspectedPage = function(){
    if (!InspectedPage._currentInspectedPage) {
        InspectedPage._currentInspectedPage = new InspectedPage();
    }
    return InspectedPage._currentInspectedPage
}

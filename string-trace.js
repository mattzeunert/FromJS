function StringTraceString(options){
    this.origin = options.origin
    this.value = options.value
    this.isStringTraceString = true
}
// getOwnPropertyNames instead of for loop b/c props aren't enumerable
Object.getOwnPropertyNames(String.prototype).forEach(function(propertyName){
    if (propertyName === "toString") { return }
    // can't use .apply on valueOf function (" String.prototype.valueOf is not generic")
    if (propertyName === "valueOf") { return }
    if (typeof String.prototype[propertyName] === "function") {
        StringTraceString.prototype[propertyName] = function(){
            return this.toString()[propertyName].apply(this, arguments)
        }
    }
})
StringTraceString.prototype.valueOf = function(){
    return this.value;
}
StringTraceString.prototype.toString = function(){
    return this.value
}

function makeTraceObject(options){
    var stringTraceObject = new StringTraceString({
        value: options.value,
        origin: options.origin
    })
    return new Proxy(stringTraceObject, {
        ownKeys: function(){
            return []
        },
        getTypeOf(){
            return "string"
        }
    });
}

function stringTrace(value){
    return makeTraceObject({
        value: value,
        origin: {
            error: new Error(),
            action: "string literal",
            values: [value]
        },
    })
};

function stringTraceTypeOf(a){
    return typeof a
}

function stringTraceAdd(a, b){
    var stack = new Error().stack
    if (a == null){
        a = ""
    }
    if (b==null){
        b = ""
    }
    if (!a.isStringTraceString && typeof a === "string"){
        a = stringTrace(a);
    }
    if (!b.isStringTraceString && typeof b === "string"){
        b = stringTrace(b);
    }
    if (!a.isStringTraceString) {
        return a + b;// not a string operation i think, could still be inferred to a stirng tho
    }

    var newValue = a.toString() + b.toString();
    return makeTraceObject({
        value: newValue,
        origin: {
            error: new Error(),
            action: "concat",
            values: [a, b]
        }
    })
}

function stringTraceNotTripleEqual(a,b){
    if (a && a.isStringTraceString) {
        a = a.toString()
    }
    if(b && b.isStringTraceString) {
        b = b.toString();
    }
    return a !== b;
}

function stringTraceTripleEqual(a,b){
    return !stringTraceNotTripleEqual(a,b)
}

function stringTraceSetInnerHTML(el, innerHTML){
    el.innerHTMLOrigin = innerHTML.origin
    el.innerHTML = innerHTML
}

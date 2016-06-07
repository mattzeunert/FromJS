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
            var oldValue = this;
            var args = unstringTracifyArguments(arguments)
            var newVal = String.prototype[propertyName].apply(this.toString(), args)
            if (typeof newVal === "string") {
                return makeTraceObject(
                    {
                        value: newVal,
                        origin: {
                            type: propertyName + " call",
                            previousValue: {
                                value: oldValue.toString(),
                                origin: oldValue.origin
                            },
                            stack: new Error().stack.split("\n")
                        }
                    }
                )
            } else {
                return newVal
            }


        }
    }
})
StringTraceString.prototype.valueOf = function(){
    return this.value;
}
StringTraceString.prototype.toString = function(){
    return this.value
}
StringTraceString.prototype.toJSON = function(){
    return this.value
}

function unstringTracifyArguments(argumentsFromOtherFn){
    var args = []
    for (var i=0;i<argumentsFromOtherFn.length; i++) {
        args.push(stringTraceUseValue(argumentsFromOtherFn[i]))
    }
    return args
}

function makeTraceObject(options){
    var stringTraceObject = new StringTraceString({
        value: options.value,
        origin: options.origin
    })
    return new Proxy(stringTraceObject, {
        ownKeys: function(){
            return []
        }
    });
}

function stringTraceUseValue(a){
    if (a && a.isStringTraceString) {
        return a.toString()
    }
    return a;
}

function stringTrace(value){
    return makeTraceObject({
        value: value,
        origin: {
            error: new Error(),
            action: "string literal",
            values: [{origin: value.origin, value: value.toString()}]
        },
    })
};

function stringTraceTypeOf(a){
    if (a && a.isStringTraceString) {
        return "string"
    }
    return typeof a

}

function stringTraceAdd(a, b){
    var stack = new Error().stack.split("\n")
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
            values: [{origin: a.origin, value: a.toString()}, {origin: b.origin, value: b.toString()}]
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

function addElOrigin(el, message, moreInfo){
    console.log(message, moreInfo)
    if (!el.__origin) {el.__origin = []}
    el.__origin.push({
        type: message,
        stack: new Error().stack.split("\n"),
        moreInfo:moreInfo
    });
}

function stringTraceSetInnerHTML(el, innerHTML){
    addElOrigin(el, "set inner html", innerHTML.origin)
    el.innerHTML = innerHTML
}

var appendChildPropertyDescriptor = Object.getOwnPropertyDescriptor(Node.prototype, "appendChild");
Object.defineProperty(Node.prototype, "appendChild", {
    get: function(){
        return function(el){
            addElOrigin(el, "append to dom el")
            return appendChildPropertyDescriptor.value.apply(this, arguments)
        }
    }
})

var nativeExec = RegExp.prototype.exec;
RegExp.prototype.exec = function(){
    var args = unstringTracifyArguments(arguments)
    return nativeExec.apply(this, args)
}

var nativeFunction = Function
window.Function = function(code){
    var args = Array.prototype.slice.apply(arguments)
    var code = args.pop()
    code = stringTraceCompile(stringTraceUseValue(code))
    args.push(code)
    return nativeFunction.apply(this, args)
}

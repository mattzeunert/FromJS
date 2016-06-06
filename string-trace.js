function stringTrace(value){
    return {
        toString: function(){
            return value;
        },
        origin: {
            error: new Error(),
            action: "string literal",
            values: [value]
        },
        isStringTraceString: true
    }
};

function stringTraceAdd(a, b){
    var stack = new Error().stack
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
    return {
        toString: function(){
            return newValue
        },
        isStringTraceString: true,
        origin: {
            error: new Error(),
            action: "concat",
            values: [a, b]
        }
    }
}

function stringTraceNotTripleEqual(a,b){
    if (a && a.isStringTraceString) {
        a = a.toString()
    }
    if(a && b.isStringTraceString) {
        b = b.toString();
    }
    return a !== b;
}

function stringTraceSetInnerHTML(el, innerHTML){
    el.innerHTMLOrigin = innerHTML.origin
    el.innerHTML = innerHTML
}

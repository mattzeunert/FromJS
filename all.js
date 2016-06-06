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

function stringTraceSetInnerHTML(el, innerHTML){
    el.innerHTMLOrigin = innerHTML.origin
    el.innerHTML = innerHTML
}
// use this to run
// babel test.js > compiled.js; cat string-trace.js compiled.js > all.js;node all.js

// debug:
// devtool  /usr/local/bin/babel test.js

(function () {
  debugger;
  var name = stringTrace("John"); //==> str(alert("Who are you"))
  var greeting = stringTrace("Hello "); //==> str("Hello")
  greeting = stringTraceAdd(greeting, name); //==> str("concat", [{from #2}, {from #1}])
  greeting = stringTraceAdd(greeting, stringTrace("!")); //==> str("concat", [{from #3}, str("!")])
  stringTraceSetInnerHTML(document.getElementById(stringTrace("content")), greeting);

  // todo: try a+ b+ c work correctly
})();


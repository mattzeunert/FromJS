// use this to run
// babel test.js > compiled.js; cat string-trace.js compiled.js > all.js;node all.js

// debug:
// devtool  /usr/local/bin/babel test.js

var name = stringTrace("John"); //==> str(alert("Who are you"))
var greeting = stringTrace("Hello "); //==> str("Hello")
greeting = stringTraceAdd(greeting, name); //==> str("concat", [{from #2}, {from #1}])
greeting = stringTraceAdd(greeting, stringTrace("!")); //==> str("concat", [{from #3}, str("!")])
stringTraceSetInnerHTML(document.getElementById(stringTrace("content")), greeting);

// todo: try a+ b+ c work correctly

//# sourceMappingURL=all.js.map
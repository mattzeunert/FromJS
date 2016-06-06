// use this to build, then open index.html in browsers
// babel test.js > compiled.js --watch

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

// use this to run
// babel test.js > compiled.js; cat string-trace.js compiled.js > all.js;node all.js

// debug:
// devtool  /usr/local/bin/babel test.js

var name = "John" //==> str(alert("Who are you"))
var greeting = "Hello "          //==> str("Hello")
greeting = greeting + name       //==> str("concat", [{from #2}, {from #1}])
greeting = greeting + "!"        //==> str("concat", [{from #3}, str("!")])
document.getElementById("content").innerHTML = greeting;

// todo: try a+ b+ c work correctly
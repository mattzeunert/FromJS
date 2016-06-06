// use this to build, then open index.html in browsers
// babel test.js > compiled.js --watch

// debug:
// devtool  /usr/local/bin/babel test.js

(function(){
debugger;
var name = "John" //==> str(alert("Who are you"))
var greeting = "Hello "          //==> str("Hello")
greeting = greeting + name       //==> str("concat", [{from #2}, {from #1}])
greeting = greeting + "!"        //==> str("concat", [{from #3}, str("!")])
document.getElementById("content").innerHTML = greeting;

// todo: try a+ b+ c work correctly
})()

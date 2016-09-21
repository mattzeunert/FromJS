function onload(){
    // document.body.innerHTML = "<div><span>Hello</span><pre>cake\nnew line</pre><span>&amp;&amp;stuff&&does this works</span></div>"
    // debugger
    // document.body.innerHTML = "<div>&amp;&amp;stuff&&does this works</div>"
    // document.body.innerHTML = "<div>a&raquo;b<span>cake</span></div>"
    // document.body.innerHTML = "<div>Hi\n\n\n\nw\nor\n\nld</div>"

    // document.body.innerHTML = '<span hi="hey"       cake="cookie">ss<!-- yolo\n\n end -->sss</span>'
 //   document.body.innerHTML = "<div \t\t\n>aaa</div>"

 // var val = $("#content").html()
 // var valEl = $(val)
 // document.body.innerHTML = valEl[0].outerHTML
 var el = document.createElementNS("http://www.w3.org/1999/xhtml", "div")
 el.innerHTML = "cake"
 document.body.appendChild(el)
 // valEl.appendTo($("body"))

}

document.onreadystatechange = function(){
    console.log("document.onreadystatechange")
}
document.addEventListener("readystatechange", function(arg){
    console.log("readystatechange", document.readyState)
})

//
// console.log(333)
// function onload(){
//     var el = document.createElement("p")
//     // el.innerHTML = eval("a = 'Hello'")
//     // el.innerHTML =["a","b"].join("-")
//     // el.innerHTML = `<div data-reactid=".0"><header class="header" data-reactid=".0.0"><h1 data-reactid=".0.0.0">todos</h1><input class="new-todo" placeholder="What needs to be done?" value="" data-reactid=".0.0.1"></header><section class="main" data-reactid=".0.1"><input class="toggle-all" type="checkbox" checked data-reactid=".0.1.0"><ul class="todo-list" data-reactid=".0.1.1"><li class="" data-reactid=".0.1.1.$496b4f17-1df5-4211-9b68-9a754d06b279"><div class="view" data-reactid=".0.1.1.$496b4f17-1df5-4211-9b68-9a754d06b279.0"><input class="toggle" type="checkbox" data-reactid=".0.1.1.$496b4f17-1df5-4211-9b68-9a754d06b279.0.0"><label data-reactid=".0.1.1.$496b4f17-1df5-4211-9b68-9a754d06b279.0.1">Hello</label><button class="destroy" data-reactid=".0.1.1.$496b4f17-1df5-4211-9b68-9a754d06b279.0.2"></button></div><input class="edit" value="Hello" data-reactid=".0.1.1.$496b4f17-1df5-4211-9b68-9a754d06b279.1"></li></ul></section><footer class="footer" data-reactid=".0.2"><span class="todo-count" data-reactid=".0.2.0"><strong data-reactid=".0.2.0.0">0</strong><span data-reactid=".0.2.0.1"> </span><span data-reactid=".0.2.0.2">items</span><span data-reactid=".0.2.0.3"> left</span></span><ul class="filters" data-reactid=".0.2.1"><li data-reactid=".0.2.1.0"><a href="#/" class="selected" data-reactid=".0.2.1.0.0">All</a></li><span data-reactid=".0.2.1.1"> </span><li data-reactid=".0.2.1.2"><a href="#/active" class="" data-reactid=".0.2.1.2.0">Active</a></li><span data-reactid=".0.2.1.3"> </span><li data-reactid=".0.2.1.4"><a href="#/completed" class="" data-reactid=".0.2.1.4.0">Completed</a></li></ul><button class="clear-completed" data-reactid=".0.2.2">Clear completed</button></footer></div>
//     // el.innerHTML = JSON.parse('{"hello": {"world": {"cake": "cookie"}}}').hello.world.cake
//
//
//     // var key = "h" + "i"
//     // var obj = {
//     //     sth: "make sure this is still tracked"
//     // }
//     // obj[key] = "world"
//     // obj.aa = "hey"
//     // var str = ""
//     // for (k in obj){
//     //     // debugger
//     //     var value = obj[k]
//     //     str += k
//     // }
//     //
//     // switch("hey"){
//     //     case obj.aa:
//     //         break;
//     //     default:
//     //         throw "no"
//     // }
//
//     var str = "";
//     var obj = {
//         hello: "world"
//     }
//     var key = "something"
//     obj[key] = "cake"
//
//     for (var k in obj){
//         str += k
//     }
//
//     el.innerHTML = str + key
//     window.obj = obj
//     document.body.appendChild(el)
// }

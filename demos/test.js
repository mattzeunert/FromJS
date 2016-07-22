function onload(){
    var el = document.createElement("p")
    // el.innerHTML = eval("a = 'Hello'")
    el.innerHTML =["a","b"].join("-")
    document.body.appendChild(el)
}

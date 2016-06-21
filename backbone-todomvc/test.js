function onload(){
    var type = "d"
    type += "iv"
    var el = document.createElement(type)
    var p = document.createElement("p")
    var span = document.createElement("span")
    p.innerHTML = "hello"
    span.innerHTML ="world"
    el.appendChild(p)
    el.appendChild(span)

    document.body.appendChild(el)
}

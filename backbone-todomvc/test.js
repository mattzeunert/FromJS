function onload(){
    var el = document.createElement("div")
    var p = document.createElement("p")
    var span = document.createElement("span")
    span.innerHTML ="xxxxxxxx"
    el.appendChild(p)
    el.appendChild(span)

    document.body.appendChild(el)
    p.innerHTML = "ooo"
}

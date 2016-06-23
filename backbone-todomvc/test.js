function onload(){
    var type = "d"
    type += "iv"
    var el = document.createElement(type)
    var c = "cake"
    el.className = c
    el.innerHTML = "hlelo".replace(/l/g, "kaa")

    document.body.appendChild(el)
}

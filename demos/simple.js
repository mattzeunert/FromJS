function onload(){
    var templ = _.template("Hello <%= name %>")
    var html = templ({name: "John"})
    var el = document.createElement("div")
    el.innerHTML = html;
    document.body.appendChild(el)
}

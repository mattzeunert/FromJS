console.log("xxx")
var el = document.createElement("script")
el.src = chrome.extension.getURL("from.js")


el.onload = function(){
    console.log("script tag on load")
}
document.documentElement.appendChild(el)
var now = new Date()
console.log("after appendChild")
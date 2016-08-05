import js from "./dist/fromjs-string"
console.log("in content script")
var el = document.createElement("script")
// el.src = chrome.extension.getURL("from.js")
el.text = decodeURI(js)


el.onload = function(){
    console.log("script tag on load")
}
document.documentElement.appendChild(el)
var now = new Date()
console.log("after appendChild")

console.log("in content script")
var el = document.createElement("script")
el.src = chrome.extension.getURL("injected.js")
document.documentElement.appendChild(el)
console.log("after appendChild")



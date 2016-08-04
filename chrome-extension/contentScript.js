var el = document.createElement("script")
el.src = chrome.extension.getURL("from.js")

document.documentElement.appendChild(el)



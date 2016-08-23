var el = document.createElement("script")
el.src = chrome.extension.getURL("injected.js")
document.documentElement.appendChild(el)

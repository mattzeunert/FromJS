var el = document.createElement("script")
el.src = chrome.extension.getURL("injected.js")
el.setAttribute("charset", "utf-8")
document.documentElement.appendChild(el)

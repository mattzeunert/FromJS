var el = document.createElement("script")
el.src = chrome.extension.getURL("injected.js")
el.setAttribute("charset", "utf-8")
document.documentElement.appendChild(el)

window.addEventListener("RebroadcastExtensionMessage", function(evt) {
    if (!evt.detail || !evt.detail.isFromJSExtensionMessage) {
        return
    }
    chrome.runtime.sendMessage(evt.detail);
}, false);

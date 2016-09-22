import processJavaScriptCode from "../src/compilation/processJavaScriptCode"
import startsWith from "starts-with"
import fromJSCss from "../src/fromjs.css"
import manifest from "./manifest" // we don't use it but we want manifest changes to trigger a webpack re-build
import beautify from "js-beautify"

var resolveFrameWorkerCode = "not loaded yet"
fetch(chrome.extension.getURL("resolveFrameWorker.js"))
.then(function(r){
    return r.text()
})
.then(function(text){
    resolveFrameWorkerCode = text
})

var tabsToProcess = [];

var messageHandlers = {
    loadScript: function(request, sender, callback){
        var code = getProcessedCodeFor(request.url)
        executeScriptOnPage(sender.tab.id, code, function(){
            callback()
        })
    }
}

chrome.runtime.onMessage.addListener(function(request, sender) {
    console.log("Got message", request)
    if (!request.isFromJSExtensionMessage) {return}

    var handler = messageHandlers[request.type];
    if (handler) {
        handler(request, sender, function(){
            executeScriptOnPage(sender.tab.id, request.callbackName + "()");
        })
    } else {
        throw "no handler for message type " + request.type
    }
});

function executeScriptOnPage(tabId, code, callback){
    var encodedCode = encodeURI(code);
    chrome.tabs.executeScript(tabId, {
        code: `
            var script = document.createElement("script");
            script.text = decodeURI("${encodedCode}");
            document.documentElement.appendChild(script)
            script.remove();
        `
    }, callback);
}

function isEnabledInTab(tabId){
    return tabsToProcess.indexOf(tabId) !== -1
}
// disabled ==> enabled ==> active
chrome.browserAction.onClicked.addListener(function (tab) {
    if (isEnabledInTab(tab.id)) {

      disableInTab(tab.id)
    } else {
        tabStage[tab.id] = "enabled"
        tabsToProcess.push(tab.id)
        initializeTab(tab.id)
    }

    updateBadge(tab)

    chrome.tabs.reload(tab.id)
});

function disableInTab(tabId){
    tabStage[tabId] = "disabled"
    tabsToProcess = tabsToProcess.filter(function(id){
      return tabId !== id
    })

    var listeners = listenersByTabId[tabId]
    chrome.webRequest.onBeforeRequest.removeListener(listeners.onBeforeRequest)
    chrome.webRequest.onHeadersReceived.removeListener(listeners.onHeadersReceived)
    delete listenersByTabId[tabId]
}

function updateBadge(tab){
    var text = ""
    if (isEnabledInTab(tab.id)) {
      text = "ON"
    }
    chrome.browserAction.setBadgeText({
      text: text,
      tabId: tab.id
    });
    chrome.browserAction.setBadgeBackgroundColor({
      tabId: tab.id,
      color: "#cc5214"
    })
}

var pageHtml = ""

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
    updateBadge(tab)

    if (!isEnabledInTab(tabId)) {
        return
    }

    var tabIsActivated = tabStage[tabId] === "active";
    if (tabIsActivated) {
        return;
    }

    if (changeInfo.status === "complete") {
        activate(tabId)
    }
    if (changeInfo.status === "loading") {
        chrome.tabs.insertCSS(tabId, {
            "code": `
                body {opacity: 0}
                html.fromJSRunning body {opacity: 1}
            `,
            runAt: "document_start"
        });
        chrome.tabs.executeScript(tabId, {
            "code": "document.body.innerHTML = 'Loading...';document.body.parentElement.classList.add('fromJSRunning')",
            runAt: "document_idle"
        });
    }

})

function activate(tabId){
  tabStage[tabId] = "active"
    chrome.tabs.insertCSS(tabId, {
      code: fromJSCss[0][1]
    })

    chrome.tabs.executeScript(tabId, {
        "file": "contentScript.js"
    });

    var encodedPageHtml = encodeURI(pageHtml)
    chrome.tabs.executeScript(tabId, {
      code: `
        var script = document.createElement("script");

        script.innerHTML = "window.pageHtml = decodeURI(\\"${encodedPageHtml}\\");";
        script.innerHTML += "window.fromJSResolveFrameWorkerCode = decodeURI(\\"${encodeURI(resolveFrameWorkerCode)}\\");"
        document.documentElement.appendChild(script)

        var script2 = document.createElement("script")
        script2.src = '${chrome.extension.getURL("from.js")}'
        script2.setAttribute("charset", "utf-8")
        document.documentElement.appendChild(script2)
      `
    })
}

var tabStage = {}

var idsToDisableOnNextMainFrameLoad = []
var sourceMaps = {}
var listenersByTabId = {}

function initializeTab(tabId){
    var onBeforeRequest = makeTabListener()
    function onHeadersReceived(details){
        if (details.type !== "main_frame") {return}

        for (var i=0; i<details.responseHeaders.length; i++) {
            if (details.responseHeaders[i].name === "Content-Security-Policy") {
                details.responseHeaders[i].value = ""
            }
        }

        return {
            responseHeaders: details.responseHeaders
        }
    }

    listenersByTabId[tabId] = {
        onBeforeRequest,
        onHeadersReceived
    }

    chrome.webRequest.onBeforeRequest.addListener(onBeforeRequest, {urls: ["<all_urls>"], tabId: tabId}, ["blocking"]);
    chrome.webRequest.onHeadersReceived.addListener(onHeadersReceived, {urls: ["<all_urls>"], tabId: tabId}, ["blocking", "responseHeaders"])
}


function getFile(url){
    var xhr = new XMLHttpRequest()
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText
}

function makeTabListener(){
    // make unique function so we can call removeListener later
    function onBeforeRequest(info){
        console.log(info.url)
        if (!isEnabledInTab(info.tabId)){
            return
        }

        if (info.url.slice(0, "chrome-extension://".length) === "chrome-extension://") {
            return
        }

        if (info.url.indexOf("/fromjs-internals/") !== -1) {
            var parts = info.url.split("/fromjs-internals/")
            var fileName = parts[1]
            return {
                redirectUrl: chrome.extension.getURL(fileName)
            }
        }

        if (info.type === "main_frame") {
            if (idsToDisableOnNextMainFrameLoad.indexOf(info.tabId) !== -1) {
                idsToDisableOnNextMainFrameLoad = idsToDisableOnNextMainFrameLoad.filter(id => id !== info.tabId)
                disableInTab(info.tabId)
                return
            } else {
                idsToDisableOnNextMainFrameLoad.push(info.tabId)
            }

            pageHtml = getFile(info.url)
            var parts = info.url.split("/");parts.pop(); parts.push("");
            var basePath = parts.join("/")
            return
        }

        if (tabStage[info.tabId] !== "active") {
            return {cancel: true}
        }


        if (info.url.slice(info.url.length - ".js.map".length) === ".js.map") {
            return {
                redirectUrl: "data:," + encodeURI(sourceMaps[info.url])
            }
        }

        var url = info.url;
        var dontProcess = false
        if (url.slice(url.length - ".dontprocess".length) === ".dontprocess") {
            dontProcess = true
            url = url.slice(0, - ".dontprocess".length)
        }

        var urlWithoutQueryParameters = url.split("?")[0]
        if (endsWith(urlWithoutQueryParameters, ".js")) {
            var code = getProcessedCodeFor(url, dontProcess)
            url = "data:application/javascript;charset=utf-8," + encodeURI(code)
            return {redirectUrl: url}
        }
    }
    return onBeforeRequest
}

function getProcessedCodeFor(url, dontProcess){
    var code = getFile(url)
    // Ideally this would happen when displaying the code in the UI,
    // rather than when it's downloaded (doing it now means the line
    // numbers will be incorrect)
    // But for now it's too much work to do it later, would need
    // to apply source maps...
    code = beautify.js_beautify(code, {indent_size: 2})

    if (!dontProcess) {
        var res = processJavaScriptCode(code, {filename: url})
        code = res.code
        code += "\n//# sourceURL=" + url
        code += "\n//# sourceMappingURL=" + url + ".map"
        sourceMaps[url + ".map"] = JSON.stringify(res.map)
    }

    return code;
}

function endsWith(str, strEnd){
  return str.slice(str.length - strEnd.length) === strEnd
}

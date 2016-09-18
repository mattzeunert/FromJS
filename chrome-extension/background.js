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

    var listener = listenersByTabId[tabId]
    chrome.webRequest.onBeforeRequest.removeListener(listener)
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
    var listener = makeTabListener()
    listenersByTabId[tabId] = listener
    chrome.webRequest.onBeforeRequest.addListener(listener, {urls: ["<all_urls>"], tabId: tabId}, ["blocking"]);
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
            var code = getFile(url)
            // Ideally this would happen when displaying the code in the UI,
            // rather than when it's downloaded (doing it now means the line
            // numbers will be incorrect)
            // But for now it's too much work to do it later, would need
            // to apply source maps...
            code = beautify.js_beautify(code, {indent_size: 2})

            if (!dontProcess) {
                var res = processJavaScriptCode(code, {filename: info.url})
                code = res.code
                code += "\n//# sourceURL=" + info.url
                code += "\n//# sourceMappingURL=" + info.url + ".map"
                sourceMaps[info.url + ".map"] = JSON.stringify(res.map)
            }
            url = "data:application/javascript;charset=utf-8," + encodeURI(code)
            return {redirectUrl: url}
        }
    }
    return onBeforeRequest
}

function endsWith(str, strEnd){
  return str.slice(str.length - strEnd.length) === strEnd
}

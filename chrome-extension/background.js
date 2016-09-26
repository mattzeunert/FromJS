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

const FromJSSessionStages = {
    RELOADING: "RELOADING",
    INITIALIZING: "INITIALIZING",
    ACTIVE: "ACTIVE",
    CLOSED: "CLOSED"
}

class FromJSSession {
    constructor(tabId) {
        this.tabId = tabId;
        this._stage = FromJSSessionStages.RELOADING;
        this._pageHtml = null;
        this._sourceMaps = {};
        this._open();
    }
    _open(){
        this._onBeforeRequest = makeOnBeforeRequest()
        this._onHeadersReceived = makeOnHeadersReceived();

        chrome.webRequest.onBeforeRequest.addListener(this._onBeforeRequest, {urls: ["<all_urls>"], tabId: this.tabId}, ["blocking"]);
        chrome.webRequest.onHeadersReceived.addListener(this._onHeadersReceived, {urls: ["<all_urls>"], tabId: this.tabId}, ["blocking", "responseHeaders"])

        chrome.tabs.reload(this.tabId)
    }
    close(){
        chrome.webRequest.onBeforeRequest.removeListener(this._onBeforeRequestListener)
        chrome.webRequest.onHeadersReceived.removeListener(this._onHeadersReceived)
        delete sessionsByTabId[this.tabId]

        this._stage = FromJSSessionStages.CLOSED;

        chrome.tabs.reload(this.tabId)
    }
    setPageHtml(pageHtml) {
        this._pageHtml = pageHtml;
    }
    initialize(){
        chrome.tabs.insertCSS(this.tabId, {
            "code": `
                body {opacity: 0}
                html.fromJSRunning body {opacity: 1}
            `,
            runAt: "document_start"
        });
        chrome.tabs.executeScript(this.tabId, {
            "code": "document.body.innerHTML = 'Loading...';document.body.parentElement.classList.add('fromJSRunning')",
            runAt: "document_idle"
        });

        this._stage = FromJSSessionStages.INITIALIZING;
    }
    activate(){
        this._stage = FromJSSessionStages.ACTIVE;

        chrome.tabs.insertCSS(this.tabId, {
          code: fromJSCss[0][1]
        })

        chrome.tabs.executeScript(this.tabId, {
            "file": "contentScript.js"
        });

        var encodedPageHtml = encodeURI(this._pageHtml)
        chrome.tabs.executeScript(this.tabId, {
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
    isActive(){
        return this._stage === FromJSSessionStages.ACTIVE;
    }
    getCode(url, processCode){
        var code = getFile(url)
        // Ideally this would happen when displaying the code in the UI,
        // rather than when it's downloaded (doing it now means the line
        // numbers will be incorrect)
        // But for now it's too much work to do it later, would need
        // to apply source maps...
        code = beautifyJS(code)

        if (processCode) {
            try {
                var res = processJavaScriptCode(code, {filename: url})
                code = res.code
                code += "\n//# sourceURL=" + url
                code += "\n//# sourceMappingURL=" + url + ".map"

                this._sourceMaps[url + ".map"] = JSON.stringify(res.map)
            } catch (err) {
                console.error("Error processing JavaScript code ", err)
                code = "console.error('FromJS couldn\\'t process JavaScript code', '" + err.toString() + "', `" + err.stack + "`)"
            }
        }

        return code;
    }
    getProcessedCode(url){
        return this.getCode(url, true)
    }
    getSourceMap(url){
        console.log("looking for", url, this._sourceMaps)
        if (!this._sourceMaps[url]) {
            console.log("doensn't have source map")
            debugger
        }
        return this._sourceMaps[url]
    }
    loadScript(requestUrl, callback){
        console.info("Fetching and processing", requestUrl)
        var code = this.getProcessedCode(requestUrl)
        console.info("Injecting", requestUrl)
        executeScriptOnPage(this.tabId, code, function(){
            callback()
        })
    }
}

var sessionsByTabId = {};
function getTabSession(tabId){
    return sessionsByTabId[tabId]
}
function createSession(tabId){
    if (getTabSession(tabId)) {
        debugger;
        console.error("Tab already has session")
    }
    var session = new FromJSSession(tabId)
    sessionsByTabId[tabId] = session;
}


var messageHandlers = {
    loadScript: function(request, sender, callback){
        var session = getTabSession(sender.tab.id)
        session.loadScript(request.url, callback)
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

chrome.browserAction.onClicked.addListener(function (tab) {
    var session = getTabSession(tab.id);
    if (session){
        session.close();
    } else {
        createSession(tab.id)
    }

    updateBadge(tab)
});

function updateBadge(tab){
    var text = ""
    var session = getTabSession(tab.id)
    if (session) {
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

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
    updateBadge(tab)

    var session = getTabSession(tabId);
    if (!session || session.isActive()){
        return
    }

    if (changeInfo.status === "complete") {
        session.activate()
    }
    if (changeInfo.status === "loading") {
        session.initialize();
    }
})

function getFile(url){
    var xhr = new XMLHttpRequest()
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText
}


function makeOnHeadersReceived(){
    return function onHeadersReceived(details){
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
}

function makeOnBeforeRequest(){
    // make unique function so we can call removeListener later
    function onBeforeRequest(info){
        var session = getTabSession(info.tabId);

        console.log("Requesting", info.url)
        if (!session){
            return;
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
            var session = getTabSession(info.tabId);
            if (session.isActive()){
                session.close();
                return;
            }

            session.setPageHtml(getFile(info.url))
            var parts = info.url.split("/");parts.pop(); parts.push("");
            var basePath = parts.join("/")
            return
        }

        if (!session.isActive()) {
            return {cancel: true}
        }


        if (info.url.slice(info.url.length - ".js.map".length) === ".js.map") {
            return {
                redirectUrl: "data:," + encodeURI(session.getSourceMap(info.url))
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
            var code = session.getCode(url, !dontProcess)
            url = "data:application/javascript;charset=utf-8," + encodeURI(code)
            return {redirectUrl: url}
        }
    }
    return onBeforeRequest
}

function beautifyJS(code){
    return beautify.js_beautify(code, {indent_size: 2})
}

function endsWith(str, strEnd){
  return str.slice(str.length - strEnd.length) === strEnd
}

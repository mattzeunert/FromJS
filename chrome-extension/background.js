import processJavaScriptCode from "../src/compilation/processJavaScriptCode"
import startsWith from "starts-with"
import fromJSCss from "../src/fromjs.css"
import manifest from "./manifest" // we don't use it but we want manifest changes to trigger a webpack re-build
import beautify from "js-beautify"
import config from "../src/config"


chrome.tabs.query({ currentWindow: true }, function (tabs) {
    var tab = tabs[0]
    if (tab.url && urlIsOnE2ETestServer(tab.url)){
        setExtensionLoadedConfirmation(tab.id)
    }
});

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
    INITIALIZED: "INITIALIZED",
    ACTIVATING: "ACTIVATING",
    ACTIVE: "ACTIVE",
    CLOSED: "CLOSED"
}

class BabelSession {
    constructor(tabId){
        this.tabId = tabId;
        this._stage = FromJSSessionStages.RELOADING;
        this._pageHtml = null;
        this._downloadCache = {}
        this._processJSCodeCache = {};
        this._open();
    }
    _open(){
        this._log("Open tab", this.tabId)
        this._onBeforeRequest = makeOnBeforeRequest()

        chrome.webRequest.onBeforeRequest.addListener(this._onBeforeRequest, {urls: ["<all_urls>"], tabId: this.tabId}, ["blocking"]);

        chrome.tabs.reload(this.tabId)
    }
    initialize(){
        this._log("Init tab", this.tabId)
        var self = this;
        this._stage = FromJSSessionStages.INITIALIZING;

        this._executeScript({
            code: `
                var el = document.createElement("script")
                el.src = "${chrome.extension.getURL("inhibitJavaScriptExecution.js")}";

                document.documentElement.appendChild(el)
            `,
            runAt: "document_start"
        }, function(){
            self._log("INITIALIZED")
            self._stage = FromJSSessionStages.INITIALIZED
        });

        chrome.tabs.insertCSS(this.tabId, {
            code: `
                body {opacity: 0}
                html.fromJSRunning body {opacity: 1}
            `,
            runAt: "document_start"
        });
        this._executeScript({
            code: "document.body.innerHTML = 'Loading...';document.body.parentElement.classList.add('fromJSRunning')",
            runAt: "document_idle"
        });
    }
    activate(){
        if (this._stage !== FromJSSessionStages.INITIALIZED) {
            this._log("Delay activation until stage is INITIALIZED")
            setTimeout(() => this.activate(), 100)
            return;
        }
        this._log("Activate tab", this.tabId)
        this._stage = FromJSSessionStages.ACTIVATING;

        chrome.tabs.insertCSS(this.tabId, {
            code: fromJSCss[0][1]
        })

        var self = this;

        self._executeScript({
            code: `
            var script = document.createElement("script")
            script.text = "window.allowJSExecution();"
            document.documentElement.appendChild(script)
            `,
        }, function(){
            self._executeScript({
                file: "contentScript.js", // loads injected.js
            }, function(){

                var encodedPageHtml = encodeURI(self._pageHtml)
                self._executeScript({
                    code: `
                        var script = document.createElement("script");

                        script.innerHTML += "window.pageHtml = decodeURI(\\"${encodedPageHtml}\\");";
                        script.innerHTML += "window.fromJSResolveFrameWorkerCode = decodeURI(\\"${encodeURI(resolveFrameWorkerCode)}\\");"
                        document.documentElement.appendChild(script)
                      `
                }, function(){
                    self.onBeforeLoad(function(){
                        self._stage = FromJSSessionStages.ACTIVE;
                    })
                })
            })
        })
    }
    _log(){
        console.log.apply(console, arguments);
        if (!this.isClosed() && config.logBGPageLogsOnInspectedPage) {
            this._executeScript("console.log('Background page log: " + JSON.stringify(arguments) + "')")
        }
    }
    _executeScript(codeOrParamObject, callback){
        if (this.isClosed()) {
            this._log("Not executing code for closed session")
            return;
        }
        var obj;
        if (typeof codeOrParamObject === "string"){
            obj = {
                code: codeOrParamObject
            }
        } else {
            obj = codeOrParamObject
        }
        chrome.tabs.executeScript(this.tabId, obj, callback)
    }
    executeScriptOnPage(code, callback){
        var encodedCode = encodeURI(code);
        this._executeScript({
            code: `
                var script = document.createElement("script");
                script.text = decodeURI("${encodedCode}");
                document.documentElement.appendChild(script)
                script.remove();
            `
        }, callback);
    }

    _getJavaScriptFile(url){
        var self = this;
        return new Promise(function(resolve, reject){
            if (self._downloadCache[url]) {
                resolve(self._downloadCache[url])
            } else {
                fetch(url)
                .then((r) => r.text())
                .then((code) => {
                    // Ideally this would happen when displaying the code in the UI,
                    // rather than when it's downloaded (doing it now means the line
                    // numbers will be incorrect)
                    // But for now it's too much work to do it later, would need
                    // to apply source maps...
                    code = beautifyJS(code)

                    self._downloadCache[url] = code
                    resolve(code)
                })
            }

        })
    }
    _processJavaScriptCode(code, options){
        var key = code + JSON.stringify(options);
        if (!this._processJSCodeCache[key]) {
            var res = processJavaScriptCode(code, options);
            this._processJSCodeCache[key] = {
                map: res.map,
                code: res.code
            };
        }
        return this._processJSCodeCache[key]
    }
    getCode(url, processCode){
        var self = this;
        var promise = new Promise(function(resolve, reject){
            self._getJavaScriptFile(url).then(function(code){
                if (processCode) {
                    try {
                        var res = self._processJavaScriptCode(code, {filename: url})
                        code = res.code
                        code += "\n//# sourceURL=" + url
                        code += "\n//# sourceMappingURL=" + url + ".map"
                    } catch (err) {
                        debugger
                        self._log("Error processing JavaScript code in " + url + err.stack)
                        console.error("Error processing JavaScript code in " + url, err)
                        code = "console.error('FromJS couldn\\'t process JavaScript code " + url + "', '" + err.toString() + "', `" + err.stack + "`)"
                    }
                }

                resolve(code)
            })
        })

        return promise;
    }
    getProcessedCode(url){
        return this.getCode(url, true)
    }
    getSourceMap(url){
        url = url.slice(0, -".map".length)
        return new Promise((resolve) => {
            this._getJavaScriptFile(url).then((code) => {
                var sourceMap = this._processJavaScriptCode(code, {filename: url}).map
                resolve(sourceMap)
            })
        })
    }
    loadScript(requestUrl, callback){
        this._log("Fetching and processing", requestUrl)
        var self =this;
        this.getProcessedCode(requestUrl)
        .then(function(code){
            self._log("Injecting", requestUrl)
            self.executeScriptOnPage(code, function(){
                if (callback){
                    callback()
                }
            })
        })
    }
    isActive(){
        return this._stage === FromJSSessionStages.ACTIVE;
    }
    close(){
        chrome.webRequest.onBeforeRequest.removeListener(this._onBeforeRequest)

        this._stage = FromJSSessionStages.CLOSED;
        this.onClosed();
    }
    isClosed(){
        return this._stage === FromJSSessionStages.CLOSED
    }
    setPageHtml(pageHtml) {
        this._pageHtml = pageHtml;
    }
    getPageHtml(){
        return this._pageHtml;
    }
}

class FromJSSession extends BabelSession {
    constructor(tabId) {
        super(tabId);
    }
    onClosed(){
        delete sessionsByTabId[this.tabId]
    }
    _open(){
        BabelSession.prototype._open.apply(this, arguments)

        this._onHeadersReceived = makeOnHeadersReceived();
        chrome.webRequest.onHeadersReceived.addListener(this._onHeadersReceived, {urls: ["<all_urls>"], tabId: this.tabId}, ["blocking", "responseHeaders"])
    }
    close(){
        BabelSession.prototype.close.apply(this, arguments)

        chrome.webRequest.onHeadersReceived.removeListener(this._onHeadersReceived)
    }
    onBeforeLoad(callback){
        this._executeScript(`
            var script2 = document.createElement("script")
            script2.src = '${chrome.extension.getURL("from.js")}'
            script2.setAttribute("charset", "utf-8")
            document.documentElement.appendChild(script2)`
        , function(){
            // ideally we'd wait for a message from the page,
            // but for now this will work
            setTimeout(function(){
                callback();
            },100)
        })
    }
}


/*
We're modifying the headers because some websites (e.g. twitter) otherwise prevent us
from creating a webworker from a blob origin.
Instead of modifying the headers we could instead move the resolveFrame web worker
into the bg page.
*/
function makeOnHeadersReceived(){
     return function onHeadersReceived(details){
         if (details.type !== "main_frame") {return}

         for (var i=0; i<details.responseHeaders.length; i++) {
             if (details.responseHeaders[i].name.toLowerCase() === "content-security-policy" ) {
                 details.responseHeaders[i].value = ""
             }
         }

         return {
             responseHeaders: details.responseHeaders
         }
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
    loadScript: function(session, request, callback){
        session.loadScript(request.url, callback)
    },
    // Use fetchUrl instead of a normal request in order to be able to
    // return processed code > 2MB (normally we redirect to a data URL,
    // which can't be > 2MB)
    fetchUrl: function(session, req, callback){
        var url = req.url

        var dontProcess = endsWith(url, ".dontprocess")
        if (dontProcess) {
            // debugger;
            url = url.slice(0, -".dontprocess".length)
        }
        if (url.slice(url.length - ".js.map".length) === ".js.map") {
            session.getSourceMap(url).then(function(sourceMap){
                callback(JSON.stringify(sourceMap))
            })
        } else if (urlLooksLikeJSFile(url)) {
            session.getCode(url, !dontProcess).then(function(code){
                callback(code)
            })
        } else if (urlLooksLikeHtmlFile(url)){
            var html = session.getPageHtml();
            callback(html)
        } else {
            console.error("No handler to fetch file", url)
            callback(null)
        }
    }
}

chrome.runtime.onMessage.addListener(function(request, sender) {
    console.log("Got message", request)
    if (!request.isFromJSExtensionMessage) {return}

    var session = getTabSession(sender.tab.id)
    if (!session){
        console.error("Got message for tab without session", request)
        return
    }

    var handler = messageHandlers[request.type];
    if (handler) {
        handler(session, request, function(){
            session.executeScriptOnPage(request.callbackName + "(decodeURI(`" + encodeURI(JSON.stringify(Array.from(arguments))) + "`))");
        })
    } else {
        throw "no handler for message type " + request.type
    }
});


function onBrowserActionClicked(tab) {
    if (startsWith(tab.url, "chrome://")) {
        alert("chrome:// URLS can't be loaded with FromJS")
        return;
    }

    var session = getTabSession(tab.id);
    if (session){
        session.close();
        chrome.tabs.reload(tab.id)
    } else {
        createSession(tab.id)
    }

    updateBadge(tab)
}
chrome.browserAction.onClicked.addListener(onBrowserActionClicked);

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

    if (tab.url && urlIsOnE2ETestServer(tab.url)){
        setExtensionLoadedConfirmation(tab.id);
    }

    if (!session && tab.url && changeInfo.status === "complete" && urlIsOnE2ETestServer(tab.url) && tab.url.indexOf("#auto-activate-fromjs") !== -1) {
        onBrowserActionClicked(tab);
    }

    if (!session || session.isActive()){
        return
    }

    console.log("changeInfo", changeInfo)
    if (changeInfo.status === "complete") {
        session.activate()
    }
    if (changeInfo.status === "loading") {
        session.initialize();
    }
})

chrome.tabs.onRemoved.addListener(function(tabId){
    var session = getTabSession(tabId);
    console.log("onremoved")
    if (session){
        console.log("closing")
        session.close();
    }
})

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

            var xhr = new XMLHttpRequest()
            xhr.open('GET', info.url, false);
            xhr.send(null);
            session.setPageHtml(xhr.responseText)

            var parts = info.url.split("/");parts.pop(); parts.push("");
            var basePath = parts.join("/")
            return
        }

        if (!session.isActive()) {
            return {cancel: true}
        }

        if (urlLooksLikeJSFile(info.url) && info.type === "script") {
            session.loadScript(info.url)
            return {cancel: true}
        }
    }
    return onBeforeRequest
}

function setExtensionLoadedConfirmation(tabId){
    chrome.tabs.executeScript(tabId, {
        code: `
        console.log('Extension is loaded');
        var s = document.createElement("script")
        s.text = "window.extensionLoaded = true;"
        document.body.appendChild(s)
        `
    })
}

function urlLooksLikeJSFile(url){
    var urlWithoutQueryParameters = url.split("?")[0]
    if (endsWith(urlWithoutQueryParameters, ".dontprocess")) {
        urlWithoutQueryParameters = urlWithoutQueryParameters.substr(0, - ".dontprocess".length)
    }
    return endsWith(urlWithoutQueryParameters, ".js")
}

function urlLooksLikeHtmlFile(url){
    var urlWithoutQueryParameters = url.split("?")[0]
    return endsWith(urlWithoutQueryParameters, ".html")
}

function urlIsOnE2ETestServer(url){
    return url.indexOf("http://localhost:9856") == 0 || url.indexOf("http://localhost:9855") == 0
}


function beautifyJS(code){
    return beautify.js_beautify(code, {indent_size: 2})
}

function endsWith(str, strEnd){
  return str.slice(str.length - strEnd.length) === strEnd
}

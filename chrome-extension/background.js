import startsWith from "starts-with"
import manifest from "./manifest" // we don't use it but we want manifest changes to trigger a webpack re-build
import config from "../src/config"
import ChromeCodeInstrumentor from "./BabelSession"

chrome.tabs.query({ currentWindow: true }, function (tabs) {
    var tab = tabs[0]
    if (tab.url && urlIsOnE2ETestServer(tab.url)){
        setExtensionLoadedConfirmation(tab.id)
    }
});

var codeInstrumentor = new ChromeCodeInstrumentor({
    babelPlugin: require("../src/compilation/plugin"),
    logBGPageLogsOnInspectedPage: config.logBGPageLogsOnInspectedPage,
    showTabStatusBadge: true,
    onCantInstrumentThisPage: function(){
        alert("This URL can't be inspected with FromJS")
    },
    onSessionOpened: function(session){
        session._onHeadersReceived = makeOnHeadersReceived();
        chrome.webRequest.onHeadersReceived.addListener(session._onHeadersReceived, {urls: ["<all_urls>"], tabId: session.tabId}, ["blocking", "responseHeaders"])
    },
    onSessionClosed: function(session){
        chrome.webRequest.onHeadersReceived.removeListener(session._onHeadersReceived)
    },
    onBeforeLoad: function(callback){
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
})

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


function onBrowserActionClicked(tab) {
    var session = codeInstrumentor.getTabSession(tab.id);
    if (session){
        session.close();
        chrome.tabs.reload(tab.id)
    } else {
        codeInstrumentor.createSession(tab.id)
    }
}
chrome.browserAction.onClicked.addListener(onBrowserActionClicked);


chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
    var session = codeInstrumentor.getTabSession(tabId);

    if (tab.url && urlIsOnE2ETestServer(tab.url)){
        setExtensionLoadedConfirmation(tab.id);
    }

    if (!session && tab.url && changeInfo.status === "complete" && urlIsOnE2ETestServer(tab.url) && tab.url.indexOf("#auto-activate-fromjs") !== -1) {
        onBrowserActionClicked(tab);
    }
})



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

function endsWith(str, strEnd){
  return str.slice(str.length - strEnd.length) === strEnd
}

function urlIsOnE2ETestServer(url){
    return url.indexOf("http://localhost:9856") == 0 || url.indexOf("http://localhost:9855") == 0
}

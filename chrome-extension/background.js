import startsWith from "starts-with"
import manifest from "./manifest" // we don't use it but we want manifest changes to trigger a webpack re-build
import config from "../src/config"
import ChromeCodeInstrumenter from "./ChromeCodeInstrumenter"

chrome.tabs.query({ currentWindow: true }, function (tabs) {
    var tab = tabs[0]
    if (tab.url && urlIsOnE2ETestServer(tab.url)){
        setExtensionLoadedConfirmation(tab.id)
    }
});

var codeInstrumenter = new ChromeCodeInstrumenter({
    babelPlugin: require("../src/compilation/plugin"),
    logBGPageLogsOnInspectedPage: config.logBGPageLogsOnInspectedPage,
    jsExecutionInhibitedMessage: "FromJS: JavaScript Execution Inhibited",
    loadingMessagePrefix: "FromJS: ",
    beautifyCode: false,
    onCantInstrumentThisPage: function(){
        alert("This URL can't be inspected with FromJS")
    },
    onInstrumentationError(err, filename, session){
        session._log("Error processing JavaScript code in " + filename + err.stack)
        console.error("Error processing JavaScript code in " + filename, err)
        var code = "console.error('FromJS couldn\\'t process JavaScript code " + filename + "', '" + err.toString() + "', `" + err.stack + "`)"
        session.executeScriptOnPage(code)
    },
    onSessionOpened: function(session){

    },
    onSessionClosed: function(session){

    },
    onBeforePageLoad: function(callback){
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

function onBrowserActionClicked(tab) {
    codeInstrumenter.toggleTabInstrumentation(tab.id)
}
chrome.browserAction.onClicked.addListener(onBrowserActionClicked);


chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
    var session = codeInstrumenter.getTabSession(tabId);

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

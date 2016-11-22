import startsWith from "starts-with"
import manifest from "./manifest" // we don't use it but we want manifest changes to trigger a webpack re-build
import config from "../src/config"
import ChromeCodeInstrumentor, {getTabSession, setSessionClass} from "../chrome-extension/BabelSession"

chrome.tabs.query({ currentWindow: true }, function (tabs) {
    var tab = tabs[0]
    if (tab.url && urlIsOnE2ETestServer(tab.url)){
        setExtensionLoadedConfirmation(tab.id)
    }
});


var codeInstrumentor = new ChromeCodeInstrumentor({
    babelPlugin: function(babel) {
        return {
            visitor: {
                AssignmentExpression(path){
            }
        }
     };
  },
  logBGPageLogsOnInspectedPage: config.logBGPageLogsOnInspectedPage,
  onBeforeLoad: function(callback){
      this._executeScript(`
          var script = document.createElement("script")
          script.text = 'window.onAfterBodyHTMLInserted= function(){};window.enableNativeMethodPatching = function(){};window.disableNativeMethodPatching = function(){};window.startLoadingPage();'
          document.documentElement.appendChild(script)`
      , function(){
          // ideally we'd wait for a message from the page,
          // but for now this will work
          setTimeout(function(){
              callback();
          },100)
      })
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
        codeInstrumentor.createSession(tab.id)
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
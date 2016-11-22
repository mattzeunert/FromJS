import startsWith from "starts-with"
import manifest from "./manifest" // we don't use it but we want manifest changes to trigger a webpack re-build
import config from "../src/config"
import ChromeCodeInstrumentor, {getTabSession, setSessionClass} from "../chrome-extension/BabelSession"


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
  showTabStatusBadge: true,
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


}
chrome.browserAction.onClicked.addListener(onBrowserActionClicked);


chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
    var session = getTabSession(tabId);

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

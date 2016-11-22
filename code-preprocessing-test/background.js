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
    var session = getTabSession(tab.id);
    if (session){
        session.close();
        chrome.tabs.reload(tab.id)
    } else {
        codeInstrumentor.createSession(tab.id)
    }
}
chrome.browserAction.onClicked.addListener(onBrowserActionClicked);

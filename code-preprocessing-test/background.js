import startsWith from "starts-with"
import manifest from "./manifest" // we don't use it but we want manifest changes to trigger a webpack re-build
import config from "../src/config"
import ChromeCodeInstrumentor from "../chrome-extension/BabelSession"


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
  showTabStatusBadge: true
});

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

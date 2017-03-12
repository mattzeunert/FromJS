import manifest from "./manifest" // we don't use it but we want manifest changes to trigger a webpack re-build
import ChromeCodeInstrumenter from "../chrome-extension/ChromeCodeInstrumenter"

var codeInstrumenter = new ChromeCodeInstrumenter({
    babelPlugin: function(babel) {
        return {
            visitor: {
                StringLiteral(path){
					// path.node.value = "Cakesss"
                }
            }
        };
    },
    logBGPageLogsOnInspectedPage: true
})

function onBrowserActionClicked(tab) {
    codeInstrumenter.toggleTabInstrumentation(tab.id)
}
chrome.browserAction.onClicked.addListener(onBrowserActionClicked);

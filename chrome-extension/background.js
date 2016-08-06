import processJavaScriptCode from "../src/compilation/processJavaScriptCode"
import startsWith from "starts-with"
import fromJSCss from "../fromjs.css"
import manifest from "./manifest" // we don't use it but we want manifest changes to trigger a webpack re-build

var tabsToProcess = [];


function isEnabledInTab(tabId){
    return tabsToProcess.indexOf(tabId) !== -1
}

chrome.browserAction.onClicked.addListener(function (tab) {
    console.log("clicked on tab", tab)
    if (isEnabledInTab(tab.id)) {
      tabsToProcess = tabsToProcess.filter(function(tabId){
          return tabId !== tab.id
      })
    } else {
      tabsToProcess.push(tab.id)
    }

    var text = ""
    if (isEnabledInTab(tab.id)) {
      text = "ON"
    }
    chrome.browserAction.setBadgeText({
      text: text,
      tabId: tab.id
    });

    chrome.tabs.reload(tab.id)

});

var initialHTMLForNextLoadedPage = "";

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
  console.log("onUpdated", arguments)
   if (changeInfo.status !== "loading") {
    console.log("not loadign ")
    return
  }
   if (!isEnabledInTab(tabId)){
      console.log("not injecting", tabId, tabsToProcess)
      return
    }
chrome.browserAction.setBadgeText({
      text: "ON",
      tabId: tabId
    });

  console.log("running")
  chrome.tabs.insertCSS(tab.id, {
    code: fromJSCss[0][1]
  })

  chrome.tabs.executeScript(tab.id, {
    code: `
      var script = document.createElement("script");
      var initialPageHtml = \`${initialHTMLForNextLoadedPage}\`.replace(/\`/g, "\\\`")
      script.innerHTML = "window.fromJSInitialPageHtml = \`" + initialPageHtml + "\`"
      document.documentElement.appendChild(script)
    `,
    runAt: "document_start"
  }, function(){
    console.log("ran fromJSinitialPageHtml", arguments)
  })

  chrome.tabs.executeScript(tab.id, {
        "file": "contentScript.js",
        runAt: "document_start"
    }, function () {
        console.log("Script Executed .. ");
    });
})

var sourceMaps = {}
chrome.webRequest.onBeforeRequest.addListener(
  function(info){
      console.log("Intercepted: " + info.url, info);

      if (!isEnabledInTab(info.tabId)){
        console.log("skiipping", info.tabId, tabsToProcess)
        return
      }
      if (info.url.slice(0, "chrome-extension://".length ) === "chrome-extension://") {
        return
      }
      if (info.url.slice(info.url.length - ".js.map".length) === ".js.map") {
        return {
          redirectUrl: "data:," + encodeURI(sourceMaps[info.url])
        }
      }
      if (info.type === "main_frame") {
          if (startsWith(info.url, "https://")) {
              return {
                  redirectUrl: "data:text/html," + encodeURI(`<!doctype html><html><body>
                      HTTPS isn't supported yet. <a target="_blank" href='https://github.com/mattzeunert/fromjs/issues'>Ask for it.</a>
                      <br/><br/>
                      URL attempted: ${info.url}
                  </body></html`)
              }
          }
        var xhr = new XMLHttpRequest()
        xhr.open('GET', info.url, false);
        xhr.send(null);
        initialHTMLForNextLoadedPage = xhr.responseText

      }
      if (info.url.slice(info.url.length - ".js".length) === ".js") {
          var xhr = new XMLHttpRequest()
          xhr.open('GET', info.url, false);
          xhr.send(null);

        //   var code = "console.log('sth')"
        var res = processJavaScriptCode(xhr.responseText, {filename: info.url})
        var code = res.code
        code += "\n//# sourceURL=" + info.url
        code += "\n//# sourceMappingURL=" + info.url + ".map"
        sourceMaps[info.url + ".map"] = JSON.stringify(res.map)
        var url = "data:," + encodeURI(code)
        return {redirectUrl: url}
      }
  }, {urls: ["<all_urls>"]}, ["blocking"]);

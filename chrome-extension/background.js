import processJavaScriptCode from "../src/compilation/processJavaScriptCode"

var tabsToProcess = [];

chrome.browserAction.onClicked.addListener(function (tab) {
    console.log("clicked on tab", tab)
    tabsToProcess.push(tab.id)
    

});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
  console.log("onUpdated", arguments)
   if (changeInfo.status !== "loading") {
    console.log("not loadign ")
    return
  }
   if (tabsToProcess.indexOf(tabId) === -1){
      console.log("not injecting", info.tabId, tabsToProcess)
      return
    }

  console.log("running")
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

      if (tabsToProcess.indexOf(info.tabId) === -1){
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

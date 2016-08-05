import processJavaScriptCode from "../src/compilation/processJavaScriptCode"

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

  console.log("running")
  chrome.tabs.insertCSS(tab.id, {
    file: "fromjs.css"
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
      if (info.type === "main_frame") {
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

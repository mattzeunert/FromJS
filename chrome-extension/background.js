import processJavaScriptCode from "../src/compilation/processJavaScriptCode"
import startsWith from "starts-with"
import fromJSCss from "../fromjs.css"
import manifest from "./manifest" // we don't use it but we want manifest changes to trigger a webpack re-build

var tabsToProcess = [];

/*
process:
1) laod example.com
2) load other page
3) click on browser action for example.com tab
*/

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

    

      chrome.tabs.insertCSS(tab.id, {
      code: fromJSCss[0][1]
      })
    chrome.tabs.executeScript(tab.id, {
      code: `
        var script = document.createElement("script");
        var pageHtml = \`${pageHtml.replace(/\`/g, "\\\\u0060")}\`
        script.innerHTML = "window.pageHtml = \`" + pageHtml + "\`;";
        document.documentElement.appendChild(script)

        var script2 = document.createElement("script")
        script2.src = '${chrome.extension.getURL("from.js")}'
        document.documentElement.appendChild(script2)
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


    // chrome.tabs.reload(tab.id)

});

var initialHTMLForNextLoadedPage = "";

var pageHtml = ""

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



  chrome.tabs.executeScript(tab.id, {
    code: `
      var script = document.createElement("script");
      var pageHtml = \`${pageHtml.replace(/\`/g, "\\\\u0060")}\`
      script.innerHTML = "window.pageHtml = \`" + pageHtml + "\`"
      document.documentElement.appendChild(script)
    `,
    runAt: "document_start"
  }, function(){
    console.log("ran fromJSinitialPageHtml", arguments)
  })

  // chrome.tabs.executeScript(tab.id, {
  //   code: `
  //     var script = document.createElement("script");
  //     var initialPageHtml = \`${initialHTMLForNextLoadedPage.replace(/\`/g, "\\\\u0060")}\`
  //     script.innerHTML = "window.fromJSInitialPageHtml = \`" + initialPageHtml + "\`"
  //     document.documentElement.appendChild(script)
  //   `,
  //   runAt: "document_start"
  // }, function(){
  //   console.log("ran fromJSinitialPageHtml", arguments)
  // })

  // chrome.tabs.executeScript(tab.id, {
  //       "file": "contentScript.js",
  //       runAt: "document_start"
  //   }, function () {
  //       console.log("Script Executed .. ");
  //   });
})

var sourceMaps = {}
chrome.webRequest.onBeforeRequest.addListener(
  function(info){

      if (info.url.slice(0, "chrome-extension://".length ) === "chrome-extension://") {
        return
      }

      if (info.type === "main_frame") {
        var xhr = new XMLHttpRequest()
        xhr.open('GET', info.url, false);
        xhr.send(null);
        initialHTMLForNextLoadedPage = xhr.responseText

        pageHtml = xhr.responseText
        var parts = info.url.split("/");parts.pop(); parts.push("");
        var basePath = parts.join("/")

        var headCode = "<base href='" + basePath + "'>"
        var fromJsUrl = chrome.extension.getURL("from.js")
        // headCode += `<script src="${fromJsUrl}" charset="utf-8"></script>`
        pageHtml = pageHtml.replace("<head>", "<head>" + headCode)
        // return {
        //     redirectUrl: "data:text/html," + encodeURI(pageHtml)
        // }
      }
      if (!isEnabledInTab(info.tabId)){
        return
      }
      if (info.url.slice(info.url.length - ".js.map".length) === ".js.map") {
        return {
          redirectUrl: "data:," + encodeURI(sourceMaps[info.url])
        }
      }

      var url = info.url;
      var dontProcess = false
      if (url.slice(url.length - ".dontprocess".length) === ".dontprocess") {
        dontProcess = true
        url = url.slice(0, - ".dontprocess".length)
      }
      if (url.slice(url.length - ".js".length) === ".js") {
          var xhr = new XMLHttpRequest()
          xhr.open('GET', url, false);
          xhr.send(null);

          if (!dontProcess) {
            var res = processJavaScriptCode(xhr.responseText, {filename: info.url})
            var code = res.code
            code += "\n//# sourceURL=" + info.url
            code += "\n//# sourceMappingURL=" + info.url + ".map"
            sourceMaps[info.url + ".map"] = JSON.stringify(res.map)
            url = "data:application/javascript;charset=utf-8," + encodeURI(code)

          }
        return {redirectUrl: url}
      }
  }, {urls: ["<all_urls>"]}, ["blocking"]);

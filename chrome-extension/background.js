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
// disabled ==> enabled ==> active 
chrome.browserAction.onClicked.addListener(function (tab) {
    if (isEnabledInTab(tab.id)) {

      disableInTab(tab.id)
    } else {
      tabStage[tab.id] = "enabled"
      tabsToProcess.push(tab.id)
    }

    updateBadge(tab)

    chrome.tabs.reload(tab.id)
});

function disableInTab(tabId){
  tabStage[tabId] = "disabled"
  tabsToProcess = tabsToProcess.filter(function(id){
      return tabId !== id
  })
}

function updateBadge(tab){
    var text = ""
    if (isEnabledInTab(tab.id)) {
      text = "ON"
    }
    chrome.browserAction.setBadgeText({
      text: text,
      tabId: tab.id
    });
    chrome.browserAction.setBadgeBackgroundColor({
      tabId: tab.id, 
      color: "#08f"
    })
}

var pageHtml = ""

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
    updateBadge(tabId)

    if (changeInfo.status !== "complete") {
        return
    }

    if (!isEnabledInTab(tabId)){
      return
    }

    activate(tabId)
})

function activate(tabId){
  tabStage[tabId] = "active"
    chrome.tabs.insertCSS(tabId, {
      code: fromJSCss[0][1]
    })

    chrome.tabs.executeScript(tabId, {
        "file": "contentScript.js",
        runAt: "document_start"
    }, function () {
        console.log("Script Executed .. ");
    });

    chrome.tabs.executeScript(tabId, {
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
    })
}

var tabStage = {}

var idsToDisableOnNextMainFrameLoad = []
var sourceMaps = {}
chrome.webRequest.onBeforeRequest.addListener(
  function(info){
    
    
  if (!isEnabledInTab(info.tabId)){
        return
      }

      if (info.url.slice(0, "chrome-extension://".length ) === "chrome-extension://") {
        return
      }

      if (info.type === "main_frame") {
        if (idsToDisableOnNextMainFrameLoad.indexOf(info.tabId) !== -1) {
            idsToDisableOnNextMainFrameLoad = idsToDisableOnNextMainFrameLoad.filter(id => id !== info.tabId)
            disableInTab(info.tabId)
            return  
        } else {
          
          idsToDisableOnNextMainFrameLoad.push(info.tabId)  

        }
        
        var xhr = new XMLHttpRequest()
        xhr.open('GET', info.url, false);
        xhr.send(null);

        pageHtml = xhr.responseText
        var parts = info.url.split("/");parts.pop(); parts.push("");
        var basePath = parts.join("/")
        return
        // var headCode = "<base href='" + basePath + "'>"
        // pageHtml = pageHtml.replace("<head>", "<head>" + headCode)
      }
      debugger
      if (tabStage[info.tabId] !== "active") {
        return {cancel: true}
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
            

          } else {
            var code = xhr.responseText
          }
          url = "data:application/javascript;charset=utf-8," + encodeURI(code)
        return {redirectUrl: url}
      }
  }, {urls: ["<all_urls>"]}, ["blocking"]);

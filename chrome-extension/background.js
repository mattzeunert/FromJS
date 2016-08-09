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

    chrome.tabs.executeScript(tab.id, {
          "file": "contentScript.js",
          runAt: "document_start"
      }, function () {
          console.log("Script Executed .. ");
      });

      chrome.tabs.insertCSS(tab.id, {
      code: fromJSCss[0][1]
      })
    chrome.tabs.executeScript(tab.id, {
      code: `
        var script = document.createElement("script");
        var pageHtml = \`${pageHtml.replace(/\`/g, "\\\\u0060")}\`
        script.innerHTML = "window.pageHtml = \`" + pageHtml + "\`;";




        script.innerHTML += \`
        window.fromJSInitialPageHtml = pageHtml;
        var bodyContent = pageHtml.split(/<body.*?>/)[1].split("</body>")[0]
        var headContent = pageHtml.split(/<head.*?>/)[1].split("</head>")[0]

        function getHtmlAndScriptTags(html){
            var scripts = []
            html = html.replace(/(\\\\<script).*?\\\\>[\\\\s\\\\S]*?\\\\<\\\\/script\\\\>/g, function(match){
                var script = document.createElement("script")
                if (match.indexOf("></script>") !== -1) {
                    script.src = match.match(/\<script.*src=['"](.*?)['"]/)[1]

                } else {
                    if (match.match(/\<script.*type=['"](.*?)['"]/) !== null){
                        script.setAttribute("type", match.match(/\<script.*type=['"](.*?)['"]/)[1])
                    }
                    if (match.match(/\<script.*id=['"](.*?)['"]/) !==null){
                        script.setAttribute("id", match.match(/\<script.*id=['"](.*?)['"]/)[1])
                    }
                    script.text = match.match(/<script.*?>([\\\\s\\\\S]*)</)[1]

                }
                scripts.push(script)
                return "";
            })
            return {
                html: html,
                scripts: scripts
            }

        }


        var h = getHtmlAndScriptTags(headContent);
        document.head.innerHTML = h.html
        h.scripts.forEach(function(script, i){
            setTimeout(function(){
                document.head.appendChild(script)
            },  i * 2000)
        })
        console.log("headscripts", h.scripts)

        var b = getHtmlAndScriptTags(bodyContent)
        bodyContent = b.html

        document.body.innerHTML = bodyContent
        b.scripts.forEach(function(script, i){
            setTimeout(function(){
                document.body.appendChild(script)
            }, 10000 + i * 2000)
        })

        \`

        document.documentElement.appendChild(script)
      `,
      runAt: "document_start"
    }, function(){
      console.log("ran fromJSinitialPageHtml", arguments)
    })




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

        pageHtml = xhr.responseText
        var headCode = "<base href='http://todomvc.com/examples/backbone/'>"
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
        var url = "data:application/javascript;charset=utf-8," + encodeURI(code)
        return {redirectUrl: url}
      }
  }, {urls: ["<all_urls>"]}, ["blocking"]);

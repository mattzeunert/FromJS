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
                    var content = match.match(/<script.*?>([\\\\s\\\\S]*)</)[1]
                    // just to make it work for now...
                    // the problem is that we might be assigning non javascript script tag content
                    // also, from.js is loaded late, so might not be loaded yet when we create this script element
                    if (typeof nativeHTMLScriptElementTextDescriptor !== "undefined") {
                        nativeHTMLScriptElementTextDescriptor.set.apply(script, [content])
                    } else {
                        script.text = content
                    }

                }
                scripts.push(script)
                return "";
            })
            return {
                html: html,
                scripts: scripts
            }

        }

        function appendScriptsOneAfterAnother(scripts, container, done){
            next()
            function next(){
                if (scripts.length === 0) {
                    done();
                    return
                }
                var script = scripts.shift()
                console.log("appending")
                if (script.innerHTML.toString() === ""){
                    script.onload = function(){
                        console.log("onload")
                        next();
                    }
                } else {
                    next();
                }

                container.appendChild(script)
            }
        }

        var h = getHtmlAndScriptTags(headContent);
        document.head.innerHTML = h.html
        appendScriptsOneAfterAnother(h.scripts, document.head, function(){
            var b = getHtmlAndScriptTags(bodyContent)
            bodyContent = b.html

            document.body.innerHTML = bodyContent
            appendScriptsOneAfterAnother(b.scripts, document.body, function(){})
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

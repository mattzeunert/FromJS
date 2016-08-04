import processJavaScriptCode from "../src/compilation/processJavaScriptCode"

var sourceMaps = {}
chrome.webRequest.onBeforeRequest.addListener(
  function(info){
      console.log("Intercepted: " + info.url);
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

import processJavaScriptCode from "../src/compilation/processJavaScriptCode"

console.log("cake")
chrome.webRequest.onBeforeRequest.addListener(
  function(info){
      console.log("Intercepted: " + info.url);
      if (info.url.slice(0, "chrome-extension://".length ) === "chrome-extension://") {
        return
      }
      if (info.url.slice(info.url.length - 3) === ".js") {
          var xhr = new XMLHttpRequest()
            xhr.open('GET', info.url, false);
            xhr.send(null);

        //   var code = "console.log('sth')"
        var code = processJavaScriptCode(xhr.responseText, {filename: info.url}).code
          var url = "data:," + encodeURI(code)
        return {redirectUrl: url}
      }
  }, {urls: ["<all_urls>"]}, ["blocking"]);

declare const chrome: any;
declare const setTimeout: any;
declare const require: any;
declare const fetch: any;
declare const btoa: any, atob: any;
declare const console: any;
declare const self: any;
declare const localStorage: any;
declare const URL: any;

const thenChrome = require("then-chrome");

var Base64 = {
  // private property
  _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

  // public method for encoding
  encode: function(input) {
    var output = "";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i = 0;

    input = Base64._utf8_encode(input);

    while (i < input.length) {
      chr1 = input.charCodeAt(i++);
      chr2 = input.charCodeAt(i++);
      chr3 = input.charCodeAt(i++);

      enc1 = chr1 >> 2;
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      enc4 = chr3 & 63;

      if (isNaN(chr2)) {
        enc3 = enc4 = 64;
      } else if (isNaN(chr3)) {
        enc4 = 64;
      }

      output =
        output +
        this._keyStr.charAt(enc1) +
        this._keyStr.charAt(enc2) +
        this._keyStr.charAt(enc3) +
        this._keyStr.charAt(enc4);
    } // Whend

    return output;
  }, // End Function encode

  // public method for decoding
  decode: function(input) {
    var output = "";
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;

    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
    while (i < input.length) {
      enc1 = this._keyStr.indexOf(input.charAt(i++));
      enc2 = this._keyStr.indexOf(input.charAt(i++));
      enc3 = this._keyStr.indexOf(input.charAt(i++));
      enc4 = this._keyStr.indexOf(input.charAt(i++));

      chr1 = (enc1 << 2) | (enc2 >> 4);
      chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      chr3 = ((enc3 & 3) << 6) | enc4;

      output = output + String.fromCharCode(chr1);

      if (enc3 != 64) {
        output = output + String.fromCharCode(chr2);
      }

      if (enc4 != 64) {
        output = output + String.fromCharCode(chr3);
      }
    } // Whend

    output = Base64._utf8_decode(output);

    return output;
  }, // End Function decode

  // private method for UTF-8 encoding
  _utf8_encode: function(string) {
    var utftext = "";
    string = string.replace(/\r\n/g, "\n");

    for (var n = 0; n < string.length; n++) {
      var c = string.charCodeAt(n);

      if (c < 128) {
        utftext += String.fromCharCode(c);
      } else if (c > 127 && c < 2048) {
        utftext += String.fromCharCode((c >> 6) | 192);
        utftext += String.fromCharCode((c & 63) | 128);
      } else {
        utftext += String.fromCharCode((c >> 12) | 224);
        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
        utftext += String.fromCharCode((c & 63) | 128);
      }
    } // Next n

    return utftext;
  }, // End Function _utf8_encode

  // private method for UTF-8 decoding
  _utf8_decode: function(utftext) {
    var string = "";
    var i = 0;
    var c, c1, c2, c3;
    c = c1 = c2 = 0;

    while (i < utftext.length) {
      c = utftext.charCodeAt(i);

      if (c < 128) {
        string += String.fromCharCode(c);
        i++;
      } else if (c > 191 && c < 224) {
        c2 = utftext.charCodeAt(i + 1);
        string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
        i += 2;
      } else {
        c2 = utftext.charCodeAt(i + 1);
        c3 = utftext.charCodeAt(i + 2);
        string += String.fromCharCode(
          ((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63)
        );
        i += 3;
      }
    } // Whend

    return string;
  } // End Function _utf8_decode
};

class TTab {
  target: any;
  tab: any;
  cookiesBefore: any;
  detached = false;
  hasReceivedRequestInterceptedEvent = false;

  constructor() {
    this.onDetach = this.onDetach.bind(this);
    this.onEvent = this.onEvent.bind(this);
  }

  async open(tab) {
    const targets = await thenChrome.debugger.getTargets();
    const target = targets.find(t => t.type === "page" && t.tabId === tab.id);
    await new Promise(resolve => setTimeout(resolve, 500)); // dont think this is needed

    this.target = target;
    this.tab = tab;

    const pageUrl = "http://localhost:7000/start/";
    // const pageUrl =
    //   "http://localhost:1212/persistent-friendly-authority.glitch.me_2020-03-25_10-04-28.report.html";
    // const pageUrl = "https://capable-ogre.glitch.me/";
    // await thenChrome.tabs.update(tab.id, { url: pageUrl });

    await this._setupDebugger();

    await thenChrome.debugger.sendCommand(this._getTargetArg(), "Page.enable");

    await this._setupRequestInterception();

    await thenChrome.tabs.update(tab.id, { url: pageUrl });

    this.log("Will open", pageUrl);
  }

  _getTargetArg() {
    return { targetId: this.target.id };
  }

  log(...args) {
    console.log.apply(console, [
      "[Tab: " + (this.tab && this.tab.id) + "]",
      ...args
    ]);
  }

  onDetach = (source, reason) => {
    this.detached = true;
    if (source.targetId === this.target.id) {
      this.log("Detached", { source, reason });
      chrome.debugger.onDetach.removeListener(this.onDetach);
      chrome.debugger.onEvent.removeListener(this.onEvent);
      // this.onExit();
    }
  };

  onEvent = (target, type, info) => {
    // this.log("On Event", type, info);
    if (target.targetId !== this.target.id) {
      // Not sure why this happens
      return;
    }
    if (type === "Network.requestIntercepted") {
      this._handleInterceptedRequest(info);
      this.hasReceivedRequestInterceptedEvent = true;
    }
    if (
      !this.hasReceivedRequestInterceptedEvent &&
      type === "Network.responseReceived"
    ) {
      // Something is wrong and a non-intercepted response was sent
      // This should not happen, but it does sometimes (in new Chrome profile? older versions?)

      console.log("resposne received", info);

      chrome.debugger.detach(this._getTargetArg());
      chrome.tabs.update(this.tab.id, {
        url: "http://example.com/?interceptFailed"
      });
    }
  };

  async _setupDebugger() {
    return new Promise(async resolve => {
      const targetArg = this._getTargetArg();

      chrome.debugger.onDetach.addListener(this.onDetach);

      await thenChrome.debugger.attach(targetArg, "1.3");

      resolve();
    });
  }

  async _setupRequestInterception() {
    await thenChrome.debugger.sendCommand(
      this._getTargetArg(),
      "Network.enable"
    );
    await thenChrome.debugger.sendCommand(
      this._getTargetArg(),
      "Network.setRequestInterception",
      { patterns: [{ urlPattern: "*", interceptionStage: "Request" }] }
    );

    chrome.debugger.onEvent.addListener(this.onEvent);
  }

  async _handleInterceptedRequest(info) {
    this.log("Request intercepted", info.request.url);
    const interceptionId = info.interceptionId;
    const targetArg = this._getTargetArg();

    if (
      info.request.url === "about:blank" ||
      info.request.url.startsWith("chrome-extension://") ||
      info.request.url.includes("/storeLogs")
    ) {
      chrome.debugger.sendCommand(
        targetArg,
        "Network.continueInterceptedRequest",
        {
          interceptionId
        }
      );
      return;
    }

    let rr;
    const res = await fetch("http://localhost:7000/makeProxyRequest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: info.request.url,
        method: info.request.method,
        headers: info.request.headers,
        postData: info.request.postData
      })
    }).then(r => {
      rr = r;
      return r.text();
    });

    console.log(Array.from);

    let responseText = `HTTP/1.1 ${rr.status}
${Array.from(rr.headers)
      .map(([headerKey, headerValue]) => {
        return `${headerKey}: ${headerValue}`;
      })
      .join("\n")}

${res}`;

    console.log("done fetch", rr, responseText.slice(0, 500));

    chrome.debugger.sendCommand(
      targetArg,
      "Network.continueInterceptedRequest",
      {
        interceptionId,
        // use this instead of btoa to avoid https://stackoverflow.com/questions/23223718/failed-to-execute-btoa-on-window-the-string-to-be-encoded-contains-characte
        rawResponse: Base64.encode(responseText)
      }
    );
  }
}

setTimeout(() => {
  chrome.tabs.create({ url: "https://example.com" }, tab => {
    // const tt = new TTab();
    // tt.open(tab);
  });
}, 100);

chrome.browserAction.onClicked.addListener(function(tab) {
  const tt = new TTab();
  tt.open(tab);
});

chrome.tabs.onCreated.addListener(tab => {
  console.log("oncreated", tab);
  chrome.tabs.update(tab.id, {
    url: "http://example.com/?settingUP"
  });
  const tt = new TTab();
  tt.open(tab);
});

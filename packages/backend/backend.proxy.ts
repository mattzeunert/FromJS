import { startProxy } from "@fromjs/proxy-instrumenter";
import { handleEvalScript } from "@fromjs/core";
declare var process: any;

process.on("message", function(message) {
  if (message.arguments[1]) {
    throw Error("todo......");
  }
  const ret = proxy[message.method].call(proxy, message.arguments[0]);

  process.send({ type: "messageResponse", ret, messageId: message.messageId });
});

let proxy;

const options = JSON.parse(process.argv[process.argv.length - 1]);

const {
  accessToken,
  bePort,
  proxyPort,
  certDirectory,
  dontTrack,
  block,
  disableDefaultBlockList
} = options;

process.title = "FromJS - Proxy (" + proxyPort + ")";

let defaultBlockList = [
  "inspectlet.com", // does a whole bunch of stuff that really slows page execution down
  "google-analytics.com",
  "newrelic.com", // overwrites some native functions used directly in FromJS (shouldn't be done ideally, but for now blocking is easier)
  "intercom.com",
  "segment.com",
  "bugsnag",
  "mixpanel",
  "piwik"
];

startProxy({
  babelPluginOptions: {
    accessToken,
    backendPort: bePort
  },
  certDirectory: certDirectory,
  handleEvalScript,
  port: proxyPort,
  instrumenterFilePath: __dirname + "/instrumentCode.js",
  verbose: false,
  shouldBlock: ({ url }) => {
    if (block.some(dt => url.includes(dt))) {
      return true;
    }
    if (
      !disableDefaultBlockList &&
      defaultBlockList.some(dt => url.includes(dt))
    ) {
      console.log(
        url +
          " blocked because it's on the default block list. You can disable this by passing in --disableDefaultBlockList"
      );
      return true;
    }
    return false;
  },
  shouldInstrument: ({ port, path, url }) => {
    if (dontTrack.some(dt => url.includes(dt))) {
      return false;
    }
    if (
      url.includes("product_registry_impl_module.js") &&
      url.includes("chrome-devtools-frontend")
    ) {
      // External file loaded by Chrome DevTools when opened
      return false;
    }
    return (
      port !== bePort ||
      path.startsWith("/start") ||
      path.startsWith("/fromJSInternal")
    );
  },
  rewriteHtml: html => {
    const originalHtml = html;
    // Not accurate because there could be an attribute attribute value like ">", should work
    // most of the time
    const openingBodyTag = html.match(/<body.*?>/);
    const openingHeadTag = html.match(/<head.*?>/);
    let bodyStartIndex;
    if (openingBodyTag) {
      bodyStartIndex =
        html.search(openingBodyTag[0]) + openingBodyTag[0].length;
    }

    let insertionIndex = 0;
    if (openingHeadTag) {
      insertionIndex =
        html.search(openingHeadTag[0]) + openingHeadTag[0].length;
    } else if (openingBodyTag) {
      insertionIndex = bodyStartIndex;
    }

    if (openingBodyTag) {
      const hasScriptTagInBody = html.slice(bodyStartIndex).includes("<script");
      if (!hasScriptTagInBody) {
        // insert script tag just so that HTML origin mapping is done
        const closingBodyTagIndex = html.search(/<\/body/);
        if (closingBodyTagIndex !== -1) {
          html =
            html.slice(0, closingBodyTagIndex) +
            `<script data-fromjs-remove-before-initial-html-mapping src="http://localhost:${bePort}/fromJSInternal/empty.js"></script>` +
            html.slice(closingBodyTagIndex);
        }
      }
    }

    // Note: we don't want to have any empty text between the text, since that won't be removed
    // alongside the data-fromjs-remove-before-initial-html-mapping tags!
    var insertedHtml =
      `<script data-fromjs-dont-instrument data-fromjs-remove-before-initial-html-mapping>window.__fromJSInitialPageHtml = decodeURI("${encodeURI(
        originalHtml
      )}")</script>` +
      `<script src="http://localhost:${bePort}/jsFiles/babel-standalone.js" data-fromjs-remove-before-initial-html-mapping></script>` +
      `<script src="http://localhost:${bePort}/jsFiles/compileInBrowser.js" data-fromjs-remove-before-initial-html-mapping></script>`;

    return (
      html.slice(0, insertionIndex) + insertedHtml + html.slice(insertionIndex)
    );
  },
  onCompilationComplete: (response: any) => {
    process.send({ type: "storeLocs", locs: response.locs });
  },
  onRegisterEvalScript: response => {
    process.send({ type: "storeLocs", locs: response.locs });
  }
}).then(p => {
  proxy = p;
  process.send({ type: "isReady" });
});

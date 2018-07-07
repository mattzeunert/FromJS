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
  block
} = options;

process.title = "FromJS - Proxy (" + proxyPort + ")";

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
    return port !== bePort || path.startsWith("/start");
  },
  rewriteHtml: html => {
    // Not using an HTML parser because it's easy (espcially getting the indices), but
    // it's also less accurate

    return (
      `<script>window.__fromJSInitialPageHtml = decodeURI("${encodeURI(
        html
      )}")</script>
      <script src="http://localhost:${bePort}/jsFiles/babel-standalone.js"></script>
      <script src="http://localhost:${bePort}/jsFiles/compileInBrowser.js"></script>
      ` + html
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

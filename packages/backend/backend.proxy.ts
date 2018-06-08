import { startProxy } from "@fromjs/proxy-instrumenter";
import { handleEvalScript } from "@fromjs/core";
declare var process: any;

import { BackendOptions } from "./BackendOptions";
process.title = "FromJS - Proxy";
process.on("message", function(message) {
  console.log("proxy got messsage", arguments);
  // debugger;
  if (message.arguments[1]) {
    throw Error("todo......");
  }
  proxy[message.method].call(proxy, message.arguments[0]);
});

let proxy;

const options = JSON.parse(process.argv[process.argv.length - 1]);

const {
  accessToken,
  options: { bePort, proxyPort }
} = options;

startProxy({
  babelPluginOptions: {
    accessToken,
    backendPort: bePort
  },
  handleEvalScript,
  port: proxyPort,
  instrumenterFilePath: __dirname + "/instrumentCode.js",
  shouldInstrument: ({ port, path }) => {
    console.log("shoul", path, bePort);
    return port !== bePort || path.startsWith("/start");
  },
  rewriteHtml: html => {
    return (
      `<script src="http://localhost:${bePort}/jsFiles/babel-standalone.js"></script>
      <script src="http://localhost:${bePort}/jsFiles/compileInBrowser.js"></script>
      ` + html
    );
  }
}).then(p => {
  proxy = p;
  process.send({ type: "isReady" });
});

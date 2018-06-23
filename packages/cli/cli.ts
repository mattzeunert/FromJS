import * as commander from "commander";
import Backend from "@fromjs/backend";
import * as process from "process";
import { BackendOptions } from "@fromjs/backend";
import * as chromeLauncher from "chrome-launcher";

const list = val => val.split(",");

commander
  .option("--shouldOpenBrowser <shouldOpen>", "yes|no|only", "yes")
  .option("-p, --port <port>", "Server port", 7000)
  .option(
    "-s, --sessionDirectory <sessionDirectory>",
    "Where to store tracking data",
    "fromjs-session"
  )
  .option(
    "-d, --dontTrack <urlParts>",
    "JS files at URLs containing the comma separated urlParts will not be instrumented. Example parameters: youtube,google",
    list,
    []
  )
  .option(
    "-b, --block <urlParts>",
    "JS files at URLs containing the comma separated urlParts will not be loaded. Example parameters: youtube,google",
    list,
    []
  )
  .version(require("../package.json").version)
  .parse(process.argv);

let bePort = parseFloat(commander.port);
let proxyPort = bePort + 1;

process["titl" + "e"] = "FromJS - CLI (" + bePort + ")";

if (commander.shouldOpenBrowser === "only") {
  process["titl" + "e"] = "FromJS - CLI (browser only)";
  console.log("Only opening browser with proxy port set to", proxyPort);
  openBrowser();
} else {
  const backendOptions = new BackendOptions({
    bePort,
    proxyPort,
    dontTrack: commander.dontTrack,
    block: commander.block,
    sessionDirectory: commander.sessionDirectory,
    onReady: async function() {
      if (commander.shouldOpenBrowser === "yes") {
        openBrowser();
      }
    }
  });
  const backend = new Backend(backendOptions);
}

async function openBrowser() {
  await chromeLauncher.launch({
    startingUrl: "http://localhost:" + bePort,
    chromeFlags: [
      "--proxy-server=127.0.0.1:" + proxyPort,
      "--ignore-certificate-errors"
    ]
  });
}

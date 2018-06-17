import * as commander from "commander";
import Backend from "@fromjs/backend";
import * as process from "process";
import { BackendOptions } from "@fromjs/backend";
import * as chromeLauncher from "chrome-launcher";

commander
  .option("--shouldOpenBrowser <shouldOpen>", "yes|no|only", "yes")
  .option("-p, --port <port>", "Server port", 7000)
  .option(
    "-s, --sessionDirectory <sessionDirectory>",
    "Where to store tracking data",
    "fromjs-session"
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
    sessionDirectory: commander.sessionDirectory,
    onReady: async function() {
      if (commander.shouldOpenBrowser === "yes") {
        openBrowser();
      }
      console.log(
        "Root certificate for HTTPS: " + backendOptions.getRootCertPath()
      );
    }
  });
  const backend = new Backend(backendOptions);
}

async function openBrowser() {
  await chromeLauncher.launch({
    startingUrl: "http://localhost:" + bePort,
    chromeFlags: ["--proxy-server=127.0.0.1:" + proxyPort]
  });
}

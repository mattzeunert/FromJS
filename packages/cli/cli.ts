import * as commander from "commander";
import Backend from "@fromjs/backend";
import * as puppeteer from "puppeteer";
import * as process from "process";
import { BackendOptions } from "@fromjs/backend";

process["titl" + "e"] = "FromJS - CLI";

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
  const browser = await puppeteer.launch({
    args: ["--proxy-server=127.0.0.1:" + proxyPort],
    headless: false
  });
  const page = await browser.newPage();
  await page.goto("http://localhost:" + bePort);
}

import * as commander from "commander";
import Backend from "@fromjs/backend";
import * as process from "process";
import { BackendOptions } from "@fromjs/backend";
import * as chromeLauncher from "chrome-launcher";

const list = val => val.split(",");

const maxOldSpaceSizeArg = process.execArgv.find(arg =>
  arg.includes("--max_old_space_size")
);
const inspectArg = process.execArgv.find(arg => arg.includes("--inspect"));

if (!maxOldSpaceSizeArg) {
  // Analysis etc can sometimes use lots of memory, so raise the memory threshold
  const fork = require("child_process").fork;
  const execArgv = process.execArgv;
  execArgv.push("--max_old_space_size=8000");
  if (inspectArg) {
    // set new port because otherwise it'll say port already in use
    execArgv.push("--inspect=36689");
  }
  const childWithMoreMemory = fork(process.argv[1], process.argv.slice(2), {
    execArgv
  });
  childWithMoreMemory.on("exit", function() {
    process.exit();
  });
  process["titl" + "e"] =
    "FromJS (launched CLI process with too low memory limit)";
} else {
  commander
    .option("--openBrowser <shouldOpen>", "yes|no|only", "yes")
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
    .option(
      "--disableDefaultBlockList",
      "Disable blocking JS files from analytics providers etc"
    )
    .version(require("../package.json").version)
    .parse(process.argv);

  let bePort = parseFloat(commander.port);
  let proxyPort = bePort + 1;

  process["titl" + "e"] = "FromJS - CLI (" + bePort + ")";

  const backendOptions = new BackendOptions({
    bePort,
    proxyPort,
    dontTrack: commander.dontTrack,
    block: commander.block,
    sessionDirectory: commander.sessionDirectory,
    disableDefaultBlockList: !!commander.disableDefaultBlockList,
    onReady: async function() {
      if (commander.openBrowser === "yes") {
        openBrowser();
      }
    }
  });

  if (commander.openBrowser === "only") {
    process["titl" + "e"] = "FromJS - CLI (browser only)";
    console.log("Only opening browser with proxy port set to", proxyPort);
    openBrowser();
  } else {
    const backend = new Backend(backendOptions);
  }

  async function openBrowser() {
    await chromeLauncher.launch({
      startingUrl: "http://localhost:" + bePort,
      chromeFlags: [
        "--proxy-server=127.0.0.1:" + proxyPort,
        "--ignore-certificate-errors",
        "--test-type", // otherwise getting unsupported command line flag: --ignore-certificate-errors
        "--user-data-dir=" + backendOptions.getChromeUserDataDirectory()
      ]
    });
  }
}

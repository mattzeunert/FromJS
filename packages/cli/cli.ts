import * as commander from "commander";
import "@fromjs/backend"; // starts BE on module load
import * as puppeteer from "puppeteer";

commander.version(require("../package.json").version).parse(process.argv);

let bePort = 7000;
let proxyPort = bePort + 1;

puppeteer.launch({
  args: ["--proxy-server=127.0.0.1:" + proxyPort],
  headless: false
});

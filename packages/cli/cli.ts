import * as commander from "commander";
import Backend from "@fromjs/backend";
import * as puppeteer from "puppeteer";
import * as opn from "opn";

commander.version(require("../package.json").version).parse(process.argv);

let bePort = 7000;
let proxyPort = bePort + 1;

const backend = new Backend({
  bePort,
  proxyPort,
  onReady: function() {
    opn("http://localhost:" + bePort);
    puppeteer.launch({
      args: ["--proxy-server=127.0.0.1:" + proxyPort],
      headless: false
    });
  }
});

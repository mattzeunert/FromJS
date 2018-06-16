const { spawn } = require("child_process");
const puppeteer = require("puppeteer");
const killPort = require("kill-port");

function setTimeoutPromise(timeout) {
  return new Promise(resolve => {
    setTimeout(resolve, timeout);
  });
}

function waitForProxyReady(command) {
  return new Promise(resolve => {
    command.stdout.on("data", function(data) {
      // not very explicit, but currently this message means the proxy is ready
      if (data.toString().includes("Root certificate")) {
        resolve();
      }
    });
  });
}

describe("E2E", () => {
  let browser;

  beforeAll(async () => {
    await killPort(12100);
    await killPort(12101);

    command = spawn(__dirname + "/bin/fromjs", [
      "--port",
      "12100",
      "--shouldOpenBrowser",
      "no",
      "--sessionDirectory",
      "/tmp/fromjs-e2e"
    ]);

    command.stderr.on("data", function(data) {
      console.log("err", data.toString());
    });

    browser = await puppeteer.launch({
      args: ["--proxy-server=127.0.0.1:12101"],
      headless: true
    });

    await waitForProxyReady(command);
  });

  let command;
  it(
    "works",
    async () => {
      const page = await browser.newPage();
      await page.goto("http://localhost:12100");
      await page.waitForSelector(".step");

      const text = await page.evaluate(
        () => document.querySelectorAll(".step")[1]["innerText"]
      );
      expect(text).toContain("StringLiteral");

      await browser.close();
      console.timeEnd("e2e");
    },
    30000
  );
});

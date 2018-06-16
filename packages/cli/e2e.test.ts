const { spawn } = require("child_process");
const puppeteer = require("puppeteer");

function setTimeoutPromise(timeout) {
  return new Promise(resolve => {
    setTimeout(resolve, timeout);
  });
}

describe("E2E", () => {
  it(
    "works",
    async () => {
      console.time("e2e");
      spawn(__dirname + "/bin/fromjs", [
        "--port",
        "12100",
        "--shouldOpenBrowser",
        "no",
        "--sessionDirectory",
        "/tmp/fromjs-e2e"
      ]);

      const browser = await puppeteer.launch({
        args: ["--proxy-server=127.0.0.1:12101"],
        headless: true
      });
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

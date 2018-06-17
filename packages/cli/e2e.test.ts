const { spawn } = require("child_process");
const puppeteer = require("puppeteer");
const killPort = require("kill-port");
const request = require("request");

const backendPort = 12100;
const proxyPort = backendPort + 1;
const webServerPort = proxyPort + 1;

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

function startWebServer() {
  return new Promise(resolve => {
    let command = spawn(__dirname + "/node_modules/.bin/http-server", [
      "-p",
      webServerPort.toString(),
      __dirname
    ]);
    command.stdout.on("data", function(data) {
      if (data.toString().includes("Hit CTRL-C to stop the server")) {
        resolve();
      }
    });
    command.stderr.on("data", function(data) {
      console.log("err", data.toString());
    });
  });
}

function inspectDomChar(charIndex) {
  return new Promise(resolve => {
    request.post(
      {
        url: "http://localhost:" + backendPort + "/inspectDomChar",
        json: {
          charIndex
        }
      },
      function(err, resp, body) {
        resolve(body);
      }
    );
  });
}

function traverse(firstStep) {
  return new Promise(resolve => {
    request.post(
      {
        url: "http://localhost:" + backendPort + "/traverse",
        json: firstStep
      },
      function(err, resp, body) {
        resolve(body);
      }
    );
  });
}

async function inspectDomCharAndTraverse(charIndex) {
  const firstStep = await inspectDomChar(charIndex);
  const steps = (await traverse(firstStep))["steps"];
  return steps[steps.length - 1];
}

describe("E2E", () => {
  let browser;

  beforeAll(async () => {
    await killPort(backendPort);
    await killPort(proxyPort);
    await killPort(webServerPort);

    command = spawn(__dirname + "/bin/fromjs", [
      "--port",
      backendPort.toString(),
      "--shouldOpenBrowser",
      "no",
      "--sessionDirectory",
      "/tmp/fromjs-e2e"
    ]);

    command.stderr.on("data", function(data) {
      console.log("err", data.toString());
    });

    browser = await puppeteer.launch({
      args: [
        "--proxy-server=127.0.0.1:" + proxyPort,
        // To make it work in CI:
        "--no-sandbox",
        "--disable-setuid-sandbox"
      ],
      headless: true
    });

    await startWebServer();
    await waitForProxyReady(command);
  });

  afterAll(async () => {
    await browser.close();
  });

  let command;
  it(
    "Can load the start page",
    async () => {
      const page = await browser.newPage();
      await page.goto("http://localhost:" + backendPort);
      await page.waitForSelector(".step");

      const text = await page.evaluate(
        () => document.querySelectorAll(".step")[1]["innerText"]
      );
      expect(text).toContain("StringLiteral");

      await page.close();
    },
    30000
  );

  it(
    "Does DOM to JS tracking",
    async () => {
      const page = await browser.newPage();
      await page.goto("http://localhost:" + webServerPort + "/test");
      const testResult = await (await page.waitForFunction(
        'window["testResult"]'
      )).jsonValue();

      const html = testResult.parts.map(p => p[0]).join("");

      console.log(html);
      console.log(
        "Waiting 2000ms for the BE to have the inspection data (mapping and logs)... should do this without timeout"
      );
      await setTimeoutPromise(2000);

      let res = await inspectDomCharAndTraverse(html.indexOf("span"));
      expect(res.operationLog.operation).toBe("stringLiteral");
      expect(res.operationLog.result.primitive).toBe("span");

      res = await inspectDomCharAndTraverse(html.indexOf("setAttribute"));
      expect(res.operationLog.operation).toBe("stringLiteral");
      expect(res.operationLog.result.primitive).toBe("setAttribute");

      res = await inspectDomCharAndTraverse(html.indexOf("attr="));
      expect(res.operationLog.operation).toBe("stringLiteral");
      expect(res.operationLog.result.primitive).toBe("attr");

      res = await inspectDomCharAndTraverse(html.indexOf("<b>"));
      expect(res.operationLog.operation).toBe("stringLiteral");
      expect(res.operationLog.result.primitive).toBe("abc<b>ddd</b>");

      res = await inspectDomCharAndTraverse(
        html.indexOf("insertAdjacentHTML2")
      );
      expect(res.operationLog.operation).toBe("stringLiteral");
      expect(res.operationLog.result.primitive).toBe(
        "<div>insertAdjacentHTML1</div><div>insertAdjacentHTML2</div>"
      );
    },
    20000
  );
});

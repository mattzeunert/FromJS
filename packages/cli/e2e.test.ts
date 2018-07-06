const { spawn } = require("child_process");
const puppeteer = require("puppeteer");
const killPort = require("kill-port");
const request = require("request");
import { OperationLog } from "@fromjs/core";

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
      if (data.toString().includes("Server listening")) {
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
  const lastStep = steps[steps.length - 1];
  return {
    charIndex: lastStep.charIndex,
    operationLog: new OperationLog(lastStep.operationLog)
  };
}

describe("E2E", () => {
  let browser;

  async function createPage() {
    const page = await browser.newPage();
    page.on("pageerror", function(err) {
      console.log("Page error: " + err.toString());
    });
    return page;
  }

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

    command.stdout.on("data", function(data) {
      console.log("CLI out", data.toString());
    });

    command.stderr.on("data", function(data) {
      console.log("CLI err", data.toString());
    });

    await waitForProxyReady(command);

    browser = await puppeteer.launch({
      dumpio: true,
      args: [
        "--proxy-server=127.0.0.1:" + proxyPort,
        // To make it work in CI:
        "--no-sandbox"
      ],
      headless: true
    });

    await startWebServer();
  }, 20000);

  afterAll(async () => {
    await browser.close();
    await killPort(backendPort);
    await killPort(proxyPort);
    await killPort(webServerPort);
  });

  const inspectorUrl = "http://localhost:" + backendPort + "/";

  let command;
  it(
    "Can load the start page",
    async () => {
      const page = await createPage();
      await page.goto(inspectorUrl);
      await page.waitForSelector(".load-demo-app");

      await await page.evaluate(() =>
        (<HTMLElement>document.querySelector(".load-demo-app")).click()
      );

      await page.waitForSelector(".step");

      const text = await page.evaluate(
        () => document.querySelectorAll(".step")[0]["innerText"]
      );
      expect(text).toContain("HTMLInputElement.value");

      await page.close();
    },
    40000
  );

  it(
    "Does DOM to JS tracking",
    async () => {
      const page = await createPage();
      await page.goto("http://localhost:" + webServerPort + "/test");
      const testResult = await (await page.waitForFunction(
        'window["testResult"]'
      )).jsonValue();

      const html = testResult.parts.map(p => p[0]).join("");

      // createElement

      let res;
      try {
        res = await inspectDomCharAndTraverse(html.indexOf("span"));
      } catch (err) {
        console.log("Looks like inspected page hasn't sent all data to BE yet");
        await setTimeoutPromise(2000);
        res = await inspectDomCharAndTraverse(html.indexOf("span"));
      }
      expect(res.operationLog.operation).toBe("stringLiteral");
      expect(res.operationLog.result.primitive).toBe("span");

      // createTextNode
      res = await inspectDomCharAndTraverse(html.indexOf("createTextNode"));
      expect(res.operationLog.operation).toBe("stringLiteral");
      expect(res.operationLog.result.primitive).toBe("createTextNode");

      // createComment
      res = await inspectDomCharAndTraverse(html.indexOf("createComment"));
      expect(res.operationLog.operation).toBe("stringLiteral");
      expect(res.operationLog.result.primitive).toBe("createComment");

      // setAttribute
      const spanHtml = '<span attr="setAttribute">abc<b>innerHTML</b></span>';
      // Calculate indices withhin because attr="setAttribute" is also used by cloned node later on
      const spanIndex = html.indexOf(spanHtml);
      const attrNameIndex = spanIndex + spanHtml.indexOf("attr=");
      const attrValueIndex = spanIndex + spanHtml.indexOf("setAttribute");
      res = await inspectDomCharAndTraverse(attrValueIndex);
      expect(res.operationLog.operation).toBe("stringLiteral");
      expect(res.operationLog.result.primitive).toBe("setAttribute");

      res = await inspectDomCharAndTraverse(attrNameIndex);
      expect(res.operationLog.operation).toBe("stringLiteral");
      expect(res.operationLog.result.primitive).toBe("attr");

      // innerHTML
      res = await inspectDomCharAndTraverse(html.indexOf("<b>"));
      expect(res.operationLog.operation).toBe("stringLiteral");
      expect(res.operationLog.result.primitive).toBe("abc<b>innerHTML</b>");

      // Comment in innerHTML
      res = await inspectDomCharAndTraverse(
        html.indexOf("<!-- COMMENT_IN_INNERTHML -->")
      );
      expect(res.operationLog.operation).toBe("stringLiteral");
      expect(res.operationLog.result.primitive).toBe(
        "<!-- COMMENT_IN_INNERTHML -->"
      );

      // insertAjacentHTML
      res = await inspectDomCharAndTraverse(
        html.indexOf("insertAdjacentHTML2")
      );
      expect(res.operationLog.operation).toBe("stringLiteral");
      expect(res.operationLog.result.primitive).toBe(
        "<div>insertAdjacentHTML1</div><div>insertAdjacentHTML2</div>"
      );

      // textContent
      res = await inspectDomCharAndTraverse(html.indexOf("textContent"));
      expect(res.operationLog.operation).toBe("stringLiteral");
      expect(res.operationLog.result.primitive).toBe("textContent");

      // cloneNode
      const clonedSpanHtml =
        '<span attr="setAttribute">cloneNode<!--createComment-->createTextNode</span>';
      const clonedSpanIndex = html.indexOf(clonedSpanHtml);
      const clonedSpanAttributeIndex =
        clonedSpanIndex + clonedSpanHtml.indexOf("attr=");
      const clonedTextIndex =
        clonedSpanIndex + clonedSpanHtml.indexOf("createTextNode");
      const clonedCommentIndex =
        clonedSpanIndex + clonedSpanHtml.indexOf("createComment");
      res = await inspectDomCharAndTraverse(clonedSpanIndex);
      expect(res.operationLog.operation).toBe("stringLiteral");
      expect(res.operationLog.result.primitive).toBe("span");

      res = await inspectDomCharAndTraverse(clonedSpanAttributeIndex);
      expect(res.operationLog.operation).toBe("stringLiteral");
      expect(res.operationLog.result.primitive).toBe("attr");

      res = await inspectDomCharAndTraverse(clonedTextIndex);
      expect(res.operationLog.operation).toBe("stringLiteral");
      expect(res.operationLog.result.primitive).toBe("createTextNode");

      res = await inspectDomCharAndTraverse(clonedCommentIndex);
      expect(res.operationLog.operation).toBe("stringLiteral");
      expect(res.operationLog.result.primitive).toBe("createComment");

      await page.close();
    },
    30000
  );

  it(
    "Can inspect backbone todomvc and select an element by clicking on it",
    async () => {
      const inspectorPage = await createPage();
      await inspectorPage.goto(inspectorUrl);

      // Load inspected page
      const page = await createPage();
      await page.goto("http://localhost:8000/examples/backbone/");
      await page.waitForSelector(".todo-list li", { timeout: 60000 });

      // Select label for inspection
      await page.waitForSelector("#fromjs-inspect-dom-button");
      await page.click("#fromjs-inspect-dom-button");
      await page.waitForFunction(
        "document.querySelector('#fromjs-inspect-dom-button').innerText.includes('Disable')"
      );
      await page.click(".todo-list li label");

      // Todo name should come from local storage
      await inspectorPage.waitForFunction(() =>
        document.body.innerHTML.includes("localStorage.getItem")
      );

      // label tag name should be string literal in eval
      // (although: we could do source mapping here again to find the origin of the eval code)
      await inspectorPage.click(".fromjs-value__content [data-key='1']");
      await inspectorPage.waitForFunction(() =>
        document.body.innerHTML.includes("eval")
      );

      await page.close();
      await inspectorPage.close();
    },
    90000
  );
});

import { start } from "repl";
import { startProxy } from "./ProxyInstrumenter";
import * as http from "http";
import * as request from "request";

const port = 14888;
const proxyPort = port + 1;

function startServer() {
  const requestHandler = (request, response) => {
    if (request.url.includes("/html")) {
      response.setHeader("content-type", "text/html");
      response.end(`
        <script src="sth.js" integrity="sha384-473gyfhsfsk" crossorigin="anonymous"></script>
      `);
    } else if (request.url.includes("/inlineScriptTags")) {
      response.setHeader("content-type", "text/html");
      response.end(`
        <script src="a"></script>
        <script>
          var a = "Hi"
        </script>
      `);
    } else {
      response.setHeader("content-type", "application/javascript");
      response.end(`Hi World!`);
    }
  };

  const server = http.createServer(requestHandler);

  return new Promise(resolve => {
    server.listen(port, err => {
      if (err) {
        return console.log("Error starting server", err);
      }

      resolve(server);
    });
  });
}

function makeRequest(path, headers = {}) {
  const r = request.defaults({ proxy: "http://127.0.0.1:" + proxyPort });
  return new Promise(resolve => {
    r({ url: "http://localhost:" + port + path, headers }, function(
      error,
      response,
      body
    ) {
      resolve(body);
    });
  });
}

describe("ProxyInstrumenter", () => {
  let server, proxy;
  beforeAll(async () => {
    server = await startServer();
    proxy = await startProxy({
      port: proxyPort,
      instrumenterFilePath: __dirname + "/testInstrumenter.js",
      silent: true,
      certDirectory: "./fromjs-session/certs",
      rewriteHtml: html => {
        return html + "EXTRA_HTML";
      },
      shouldBlock: function({ url }) {
        return url.includes("/blocked");
      },
      shouldInstrument: function({ path }) {
        if (path.indexOf("/dontRewrite") === 0) {
          return false;
        }
        return true;
      },
      handleEvalScript: function(code, compile, details, callback) {
        const url = "http://example.com/eval.js";
        return compile(code, url, babelResult => {
          const instrumentedCode = babelResult.code + "\n//# sourceURL=" + url;
          const map = JSON.stringify(babelResult.map);
          callback({
            map,
            instrumentedCode,
            code,
            url
          });
        });
      }
    });
  }, 10000);

  afterAll(() => {
    server.close();
    proxy.close();
  });

  it(
    "Intercepts and rewrite requests",
    async () => {
      const response = await makeRequest("/test.js");
      expect(response).toBe("Hello World!");
    },
    10000
  );

  it(
    "Can skip rewritting some URLs",
    async () => {
      const response = await makeRequest("/dontRewrite/test.js");
      expect(response).toBe("Hi World!");
    },
    10000
  );

  it(
    "Can handle eval'd scripts",
    async () => {
      const result = await proxy.instrumentForEval(`var a = "Hi"`);
      expect(result.instrumentedCode).toContain("Hello");
    },
    10000
  );

  it(
    "Can rewrite HTML",
    async () => {
      const response = await makeRequest("/html", {
        accept: "text/html"
      });
      expect(response).toContain("EXTRA_HTML");
    },
    10000
  );

  it(
    "Instruments inline script tags in HTML",
    async () => {
      const response = await makeRequest("/inlineScriptTags", {
        accept: "text/html"
      });
      expect(response).toContain('a = "Hello"');
    },
    10000
  );

  it(
    "Removes script tag integrity checks",
    async () => {
      const response = await makeRequest("/html", {
        accept: "text/html"
      });
      expect(response).toContain(
        `<script src="sth.js" crossorigin="anonymous"></script>`
      );
    },
    10000
  );

  it(
    "Can block some URLs",
    async () => {
      const response = await makeRequest("/blocked");
      expect(response).toBe("");
    },
    10000
  );
});

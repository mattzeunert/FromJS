import { start } from "repl";
import { startProxy } from "./ProxyInstrumenter";
import * as http from "http";
import * as request from "request";

const port = 18943;
const proxyPort = port + 1;

function startServer() {
  const requestHandler = (request, response) => {
    response.end(`Hi World!`);
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

function makeRequest(path) {
  const r = request.defaults({ proxy: "http://127.0.0.1:" + proxyPort });
  return new Promise(resolve => {
    r({ url: "http://localhost:" + port + path }, function(
      error,
      response,
      body
    ) {
      resolve(body);
    });
  });
}

it("Intercepts and rewrite requests", async () => {
  const server: any = await startServer();
  const proxy: any = await startProxy({
    port: proxyPort,
    instrumenterFilePath: __dirname + "/testInstrumenter.js"
  });
  const response = await makeRequest("/test.js");
  server.close();
  proxy.close();
  expect(response).toBe("Hello World!");
});

it("And skip rewritting some URLs", async () => {
  const server: any = await startServer();
  const proxy: any = await startProxy({
    port: proxyPort,
    instrumenterFilePath: __dirname + "/testInstrumenter.js",
    shouldInstrument: function({ path }) {
      if (path.indexOf("/dontRewrite") === 0) {
        return false;
      }
      return true;
    }
  });
  const response = await makeRequest("/dontRewrite/test.js");
  server.close();
  proxy.close();
  expect(response).toBe("Hi World!");
});

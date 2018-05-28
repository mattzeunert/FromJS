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

function makeRequest() {
  const r = request.defaults({ proxy: "http://127.0.0.1:" + proxyPort });
  return new Promise(resolve => {
    r({ url: "http://localhost:" + port + "/test.js" }, function(
      error,
      response,
      body
    ) {
      resolve(body);
    });
  });
}

it("Tests proxy", async () => {
  const server: any = await startServer();
  const proxy: any = await startProxy({
    port: proxyPort,
    instrumenterFilePath: __dirname + "/testInstrumenter.js"
  });
  const response = await makeRequest();
  server.close();
  proxy.close();
  expect(response).toBe("Hello World!");
});

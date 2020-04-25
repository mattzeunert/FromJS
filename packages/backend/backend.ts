import {
  LevelDBLogServer,
  HtmlToOperationLogMapping,
  LocStore,
  traverseDomOrigin,
} from "@fromjs/core";
import { traverse } from "./src/traverse";
import StackFrameResolver from "./src/StackFrameResolver";
import * as fs from "fs";
import * as crypto from "crypto";
import * as path from "path";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as WebSocket from "ws";
import { createProxy } from "./backend.createProxy";
import { BackendOptions } from "./BackendOptions";
import * as responseTime from "response-time";
import { config } from "@fromjs/core";
import { RequestHandler } from "./RequestHandler";
import * as pMap from "p-map";
import * as puppeteer from "puppeteer";

const ENABLE_DERIVED = true;

let uiDir = require
  .resolve("@fromjs/ui")
  .split(/[\/\\]/g)
  .slice(0, -1)
  .join("/");
let coreDir = require
  .resolve("@fromjs/core")
  .split(/[\/\\]/g)
  .slice(0, -1)
  .join("/");
let fromJSInternalDir = path.resolve(__dirname + "/../fromJSInternal");

let startPageDir = path.resolve(__dirname + "/../start-page");

function ensureDirectoriesExist(options: BackendOptions) {
  const directories = [
    options.sessionDirectory,
    options.getCertDirectory(),
    options.getTrackingDataDirectory(),
    options.sessionDirectory + "/files",
  ];
  directories.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
  });
}
function createBackendCerts(options: BackendOptions) {
  fs.mkdirSync(options.getBackendServerCertDirPath());
  const Forge = require("node-forge");
  const pki = Forge.pki;
  var keys = pki.rsa.generateKeyPair({ bits: 2048, e: 0x10001 });

  var cert = pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.validity.notBefore = new Date();
  cert.validity.notBefore.setDate(cert.validity.notBefore.getDate() - 1);
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(
    cert.validity.notBefore.getFullYear() + 10
  );
  cert.sign(keys.privateKey, Forge.md.sha256.create());

  fs.writeFileSync(
    options.getBackendServerCertPath(),
    pki.certificateToPem(cert)
  );
  fs.writeFileSync(
    options.getBackendServerPrivateKeyPath(),
    pki.privateKeyToPem(keys.privateKey)
  );
}

const DELETE_EXISTING_LOGS_AT_START = false;
const LOG_PERF = config.LOG_PERF;

function getNodeFiles(baseDirectory, subdirectory) {
  let resolvedDir = path.resolve(baseDirectory + "/" + subdirectory);

  let nodeFiles: {
    relativePath: string;
    subdirectory: string;
    name: string;
  }[] = [];

  const files = fs.readdirSync(resolvedDir);
  for (const file of files) {
    let filePath = path.resolve(resolvedDir, file);
    if (fs.lstatSync(filePath).isDirectory()) {
      nodeFiles = [
        ...nodeFiles,
        ...getNodeFiles(baseDirectory, subdirectory + file + "/"),
      ];
    } else {
      nodeFiles.push({
        relativePath: subdirectory + file,
        subdirectory,
        name: file,
      });
    }
  }

  return nodeFiles;
}

async function compileNodeApp(baseDirectory, requestHandler: RequestHandler) {
  let files = getNodeFiles(baseDirectory, "");

  await pMap(
    files,
    async (file, i) => {
      console.log("## " + file.relativePath, `${i}/${files.length}`);

      let outdir = "./node-test-compiled/" + file.subdirectory;
      const outFilePath = outdir + file.name;
      if (
        fs.existsSync(outFilePath) &&
        !file.name.includes("test.js") &&
        !file.name.includes("driver.js") &&
        !file.name.includes("page-functions.js")
      ) {
        return;
      }

      let nodeFile = fs.readFileSync(
        path.resolve(baseDirectory, file.relativePath),
        "utf-8"
      );
      require("mkdirp").sync(outdir);

      if (
        file.name.endsWith(".js") &&
        !file.subdirectory.includes("locale-data") &&
        !file.subdirectory.includes("jsdoc")
      ) {
        try {
          const r = (await requestHandler.instrumentForEval(nodeFile, {
            type: "node_",
            name: file.relativePath.replace(/[^a-zA-Z0-9\-]/g, "_"),
          })) as any;
          fs.writeFileSync(
            outFilePath,
            `/*require("/Users/mattzeunert/Documents/GitHub/FromJS/node-test-compiled/__fromJSENv.js")*/
          ;var global = Function("return this")(); global.self = global; global.fromJSIsNode = true;\n` +
              r.instrumentedCode
          );
        } catch (err) {
          console.log(
            "Comopile code failed, will write normal",
            file.relativePath,
            err.message
          );
          fs.writeFileSync(outFilePath, nodeFile);
        }
      } else {
        fs.writeFileSync(outFilePath, nodeFile);
      }
    },
    { concurrency: 4 }
  );

  let helperFunctions = fs.readFileSync(
    "./packages/core/helperFunctions.js",
    "utf-8"
  );
  console.log(helperFunctions.slice(0, 100));

  fs.writeFileSync(
    "./node-test-compiled/__fromJSEnv.js",
    helperFunctions +
      `; global.helperFunctionsCode = decodeURIComponent("${encodeURIComponent(
        helperFunctions
      )}")`
  );
}

export default class Backend {
  constructor(options: BackendOptions) {
    console.time("create backend");
    if (DELETE_EXISTING_LOGS_AT_START) {
      console.log(
        "deleting existing log data, this makes sure perf data is more comparable... presumably leveldb slows down with more data"
      );
      require("rimraf").sync(options.getLocStorePath());
      require("rimraf").sync(options.getTrackingDataDirectory());
    }
    ensureDirectoriesExist(options);

    // seems like sometimes get-folder-size runs into max call stack size exceeded, so disable it
    // getFolderSize(options.sessionDirectory, (err, size) => {
    //   console.log(
    //     "Session size: ",
    //     (size / 1024 / 1024).toFixed(2) +
    //       " MB" +
    //       " (" +
    //       path.resolve(options.sessionDirectory) +
    //       ")"
    //   );
    // });

    let sessionConfig;
    function saveSessionConfig() {
      fs.writeFileSync(
        options.getSessionJsonPath(),
        JSON.stringify(sessionConfig, null, 4)
      );
    }
    if (fs.existsSync(options.getSessionJsonPath())) {
      const json = fs.readFileSync(options.getSessionJsonPath()).toString();
      sessionConfig = JSON.parse(json);
    } else {
      sessionConfig = {
        accessToken: crypto.randomBytes(32).toString("hex"),
      };
      saveSessionConfig();
    }

    var { bePort, proxyPort } = options;

    const app = express();

    if (LOG_PERF) {
      console.log("will log perf");
      app.use(
        responseTime((req, res, time) => {
          console.log(req.method, req.url, Math.round(time) + "ms");
        })
      );
    }

    app.use(bodyParser.json({ limit: "250mb" }));

    if (!fs.existsSync(options.getBackendServerCertDirPath())) {
      createBackendCerts(options);
    }

    const http = require("http");
    const server = http.createServer(app);

    const wss = new WebSocket.Server({
      server,
    });

    // Needed or else websocket connection doesn't work because of self-signed cert
    // process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    // "Access-Control-Allow-Origin: *" allows any website to send data to local server
    // but that might be bad, so limit access to code generated by Babel plugin
    app.verifyToken = function verifyToken(req) {
      const { authorization } = req.headers;
      const { accessToken } = sessionConfig;
      if (authorization !== accessToken) {
        throw Error(
          "Token invalid: " + authorization + " should be " + accessToken
        );
      }
    };

    function getProxy() {
      return proxyInterface;
    }

    const files = fs.existsSync(options.sessionDirectory + "/files.json")
      ? JSON.parse(
          fs.readFileSync(
            options.sessionDirectory + "/" + "files.json",
            "utf-8"
          )
        )
      : [];
    const locLogs = fs.existsSync(options.sessionDirectory + "/locLogs.json")
      ? JSON.parse(
          fs.readFileSync(
            options.sessionDirectory + "/" + "locLogs.json",
            "utf-8"
          )
        )
      : {};
    const logUses = fs.existsSync(options.sessionDirectory + "/logUses.json")
      ? JSON.parse(
          fs.readFileSync(
            options.sessionDirectory + "/" + "logUses.json",
            "utf-8"
          )
        )
      : {};
    setInterval(() => {
      console.time("save json");
      fs.writeFileSync(
        options.sessionDirectory + "/files.json",
        JSON.stringify(files, null, 2)
      );
      if (ENABLE_DERIVED) {
        fs.writeFileSync(
          options.sessionDirectory + "/locLogs.json",
          JSON.stringify(locLogs, null, 2)
        );
        fs.writeFileSync(
          options.sessionDirectory + "/logUses.json",
          JSON.stringify(logUses, null, 2)
        );
      }
      console.timeEnd("save json");
    }, 10000);

    let requestHandler;

    let { storeLocs } = setupBackend(
      options,
      app,
      wss,
      getProxy,
      files,
      locLogs,
      logUses,
      () => requestHandler
    );
    setupUI(options, app, wss, getProxy, files, () => requestHandler);

    requestHandler = makeRequestHandler({
      accessToken: sessionConfig.accessToken,
      options,
      storeLocs,
      files,
    });

    // compileNodeApp("node-test", requestHandler);

    let proxyInterface;
    const proxyReady = Promise.resolve();
    // const proxyReady = createProxy({
    //   accessToken: sessionConfig.accessToken,
    //   options,
    //   storeLocs
    // });
    // proxyReady.then(pInterface => {
    //   proxyInterface = pInterface;
    //   "justtotest" && getProxy();
    //   if (options.onReady) {
    //     options.onReady();
    //   }
    // });

    ["/storeLogs", "/inspect", "/inspectDOM"].forEach((path) => {
      // todo: don't allow requests from any site
      app.options(path, allowCrossOriginRequests);
    });

    const serverReady = new Promise((resolve) => {
      server.listen(bePort, () => resolve());
    });

    console.timeLog("create backend", "end of function");
    Promise.all([proxyReady, serverReady]).then(function () {
      console.timeEnd("create backend");
      console.log("Server listening on port " + bePort);
    });
  }
}

function setupUI(options, app, wss, getProxy, files, getRequestHandler) {
  wss.on("connection", (ws: WebSocket) => {
    // console.log("On ws connection");
    if (domToInspect) {
      ws.send(
        JSON.stringify({
          type: "inspectDOM",
          ...getDomToInspectMessage(),
        })
      );
    } else if (logToInspect) {
      broadcast(
        wss,
        JSON.stringify({
          type: "inspectOperationLog",
          operationLogId: logToInspect,
        })
      );
    }
  });

  app.get("/fromJSInitPage", (req, res) => {
    res.end(`<!doctype html>
    <head>
      <title>fromJSInitPage</title>
    </head>
    <body>
    Initializing...
    </body>
    </html>`);
  });

  app.get("/enableDebugger", (req, res) => {
    res.end(`<!doctype html>
    <body>
    Enabling request interception...
    </body>
    </html>`);
  });

  app.get("/", (req, res) => {
    let html = fs.readFileSync(uiDir + "/index.html").toString();
    html = html.replace(/BACKEND_PORT_PLACEHOLDER/g, options.bePort.toString());
    // getProxy()
    //   ._getEnableInstrumentation()
    Promise.resolve(true).then(function (enabled) {
      html = html.replace(
        /BACKEND_PORT_PLACEHOLDER/g,
        options.bePort.toString()
      );
      html = html.replace(
        /ENABLE_INSTRUMENTATION_PLACEHOLDER/g,
        enabled.toString()
      );
      res.send(html);
    });
  });

  app.post("/makeProxyRequest", async (req, res) => {
    const url = req.body.url;
    console.log("makeProxyReq", url);

    const {
      status,
      headers,
      body,
      fileKey,
    } = await getRequestHandler().handleRequest(req.body);

    res.status(status);

    // I think some headres like allow origin don't reach the client js
    // and are stripped by the browses
    // https://stackoverflow.com/questions/43344819/reading-response-headers-with-fetch-api
    res.set("access-control-expose-headers", "*");
    res.set("Access-Control-Allow-Origin", "*");
    Object.keys(headers).forEach((headerKey) => {
      if (headerKey === "content-length") {
        // was getting this wrong sometimes, easier to just not send it
        return;
      }
      res.set(headerKey, headers[headerKey]);
    });

    res.end(body);

    // const r = await axios({
    //   url,
    //   method: req.body.method,
    //   headers: req.body.headers,
    //   validateStatus: status => true,
    //   transformResponse: data => data,
    //   proxy: {
    //     host: "127.0.0.1",
    //     port: options.proxyPort
    //   },
    //   data: req.body.postData
    // });

    // const data = r.data;
    // const headers = r.headers;

    // const hasha = require("hasha");
    // const hash = hasha(data, "hex").slice(0, 8);

    // let fileKey =
    //   url.replace(/\//g, "_").replace(/[^a-zA-Z\-_\.0-9]/g, "") + "_" + hash;

    // if (!files.find(f => f.key === fileKey)) {
    //   files.push({
    //     url,
    //     hash,
    //     createdAt: new Date(),
    //     key: fileKey
    //   });
    // }

    // res.status(r.status);

    // Object.keys(headers).forEach(headerKey => {
    //   res.set(headerKey, headers[headerKey]);
    // });

    // res.end(Buffer.from(data));
  });

  app.get("/viewFile/", (req, res) => {});

  app.use(express.static(uiDir));
  app.use("/fromJSInternal", express.static(fromJSInternalDir));
  app.use("/start", express.static(startPageDir));

  function getDomToInspectMessage(charIndex?) {
    if (!domToInspect) {
      return {
        err: "Backend has no selected DOM to inspect",
      };
    }

    const mapping = new HtmlToOperationLogMapping((<any>domToInspect).parts);

    const html = mapping.getHtml();
    let goodDefaultCharIndex = 0;

    if (charIndex !== undefined) {
      goodDefaultCharIndex = charIndex;
    } else {
      const charIndexWhereTextFollows = html.search(/>[^<]/);
      if (
        charIndexWhereTextFollows !== -1 &&
        mapping.getOriginAtCharacterIndex(charIndexWhereTextFollows)
      ) {
        goodDefaultCharIndex = charIndexWhereTextFollows;
        goodDefaultCharIndex++; // the > char
        const first10Chars = html.slice(
          goodDefaultCharIndex,
          goodDefaultCharIndex + 10
        );
        const firstNonWhitespaceOffset = first10Chars.search(/\S/);
        goodDefaultCharIndex += firstNonWhitespaceOffset;
      }
    }

    return {
      html: (<any>domToInspect).parts.map((p) => p[0]).join(""),
      charIndex: goodDefaultCharIndex,
    };
  }

  let domToInspect = null;
  app.post("/inspectDOM", (req, res) => {
    app.verifyToken(req);

    res.set("Access-Control-Allow-Origin", "*");
    res.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With"
    );

    domToInspect = req.body;

    broadcast(
      wss,
      JSON.stringify({
        type: "inspectDOM",
        ...getDomToInspectMessage(req.body.charIndex),
      })
    );

    res.end("{}");
  });

  let logToInspect = null;
  app.post("/inspectDomChar", (req, res) => {
    if (!domToInspect) {
      res.status(500);
      res.json({
        err: "Backend has no selected DOM to inspect",
      });
      res.end();
      return;
    }

    const mapping = new HtmlToOperationLogMapping((<any>domToInspect).parts);
    const mappingResult: any = mapping.getOriginAtCharacterIndex(
      req.body.charIndex
    );

    if (!mappingResult.origin) {
      res.end(
        JSON.stringify({
          logId: null,
        })
      );
      return;
    }

    const origin = mappingResult.origin;

    res.end(
      JSON.stringify({
        logId: origin.trackingValue,
        charIndex: traverseDomOrigin(origin, mappingResult.charIndex),
      })
    );
  });
  app.post("/inspect", (req, res) => {
    allowCrossOrigin(res);

    app.verifyToken(req);
    logToInspect = req.body.logId;
    res.end("{}");

    broadcast(
      wss,
      JSON.stringify({
        type: "inspectOperationLog",
        operationLogId: logToInspect,
      })
    );
  });

  options.onReady();
}

function setupBackend(
  options: BackendOptions,
  app,
  wss,
  getProxy,
  files,
  locLogs,
  logUses,
  getRequestHandler
) {
  const locStore = new LocStore(options.getLocStorePath());
  const logServer = new LevelDBLogServer(
    options.getTrackingDataDirectory(),
    locStore
  );

  function getLocs(url) {
    return new Promise((resolve, reject) => {
      let locs: any[] = [];
      let i = locStore.db.iterator();
      function iterate(error, key, value) {
        if (value) {
          value = JSON.parse(value);
          if (value.url.includes(url)) {
            locs.push({ key: key.toString(), value });
          }
        }
        if (key) {
          i.next(iterate);
        } else {
          resolve(locs);
        }
      }
      i.next(iterate);
    });
  }

  app.get("/xyzviewer", async (req, res) => {
    res.end(`<!doctype html>
      <style>
      .myInlineDecoration-multiline-start {
        background: cyan;
        cursor: pointer;
      }
      .myInlineDecoration-has {
        background: yellow;
        cursor: pointer;
      }
      .myInlineDecoration-hasMany {
        background: orange;
        cursor: pointer;
      }
      .myInlineDecoration-none {
        background: #ddd;
        cursor: pointer;
      }
      </style>
      <script>
      window["backendPort"] =7000;
      </script>
      <div>
        <div id="appx"></div>
      </div>
      <script src="http://localhost:7000/dist/bundle.js"></script>
    `);
  });

  app.get("/xyzviewer/fileInfo", (req, res) => {
    res.json(files);
  });

  app.get("/xyzviewer/fileDetails/:fileKey", async (req, res) => {
    let file = files.find((f) => f.fileKey === req.params.fileKey);
    let url = file.url;

    const { body: fileContent } = await getRequestHandler().handleRequest({
      url: url + "?dontprocess",
      method: "GET",
    });

    const locs = (await getLocs(url)) as any;

    console.time("ttt");
    for (const loc of locs) {
      loc.logCount = (locLogs[loc.key] || []).length;
    }
    console.timeEnd("ttt");

    res.json({ fileContent, locs });
  });

  function getLogs(locId) {
    return new Promise((resolve, reject) => {
      let iterator = logServer.db.iterator();
      let logs: any[] = [];
      async function iterate(err, key, value) {
        if (value) {
          value = JSON.parse(value.toString());
          if (value.loc === locId) {
            logs.push({
              key: key.toString(),
              value: value,
            });
          }

          iterator.next(iterate);
        } else {
          resolve(logs);
        }
      }
      iterator.next(iterate);
    });
  }

  function getLogsWhere(whereFn) {
    return new Promise((resolve, reject) => {
      let iterator = logServer.db.iterator();
      let logs: any[] = [];
      async function iterate(err, key, value) {
        if (value) {
          value = JSON.parse(value.toString());
          if (whereFn(value)) {
            logs.push({
              key: key.toString(),
              value: value,
            });
          }

          iterator.next(iterate);
        } else {
          resolve(logs);
        }
      }
      iterator.next(iterate);
    });
  }

  async function findUses(logIndex) {
    let uses: any[] = [];
    let lookupQueue = [logIndex];
    while (lookupQueue.length > 0) {
      let lookupIndex = lookupQueue.shift();
      let u = (await Promise.all(
        (logUses[lookupIndex] || []).map(async (uIndex) => {
          return {
            value: await logServer.loadLogAwaitable(uIndex, 0),
          };
        })
      )) as any[];

      for (const uu of u) {
        lookupQueue.push(uu.value.index);

        uses.push({ use: uu, lookupIndex });
      }
    }

    return uses;

    // let uses = [];
    // let lookupQueue = [logIndex];
    // while (lookupQueue.length > 0) {
    //   let lookupIndex = lookupQueue.shift();
    //   let u = await getLogsWhere(log => {
    //     return Object.keys(log.args || {}).some(k => {
    //       let v = log.args[k];

    //       if (typeof v === "number") {
    //         return v === lookupIndex;
    //       } else if (Array.isArray(v)) {
    //         return v.includes(lookupIndex);
    //       } else if (v) {
    //         throw Error("not possible i think");
    //       }
    //       return false;
    //     });
    //     // return log.index === 624973639059090;
    //   });

    //   for (const uu of u) {
    //     lookupQueue.push(uu.value.index);
    //     uses.push(uu);
    //   }
    // }

    // return uses;
  }

  app.get("/xyzviewer/getUses/:logId", async (req, res) => {
    let uses = (await findUses(parseFloat(req.params.logId))) as any;

    if (req.query.operationFilter) {
      uses = uses.filter(
        (u) => u.use.value.operation === req.query.operationFilter
      );
    }

    uses = await Promise.all(
      uses.map(async (u) => {
        const log = (await logServer.loadLogAwaitable(
          u.use.value.index,
          1
        )) as any;

        const arg = Object.entries(log.args).filter(
          //@ts-ignore
          ([i, l]) => l && l.index === u.lookupIndex
        );
        const argName = arg && arg[0] && arg[0][0];
        return {
          use: log,
          argName,
        };
      })
    );

    res.json(uses);
  });

  app.get("/xyzviewer/trackingDataForLoc/:locId", async (req, res) => {
    console.time("get logs");
    let locs = (await getLogs(req.params.locId)) as any;
    console.timeEnd("get logs");
    locs = await Promise.all(
      locs.map(async (loc) => {
        const v2 = await logServer.loadLogAwaitable(
          parseFloat(loc.value.index),
          0
        );
        return {
          key: loc.key,
          value: v2,
        };
      })
    );
    res.json(locs);
  });

  app.get("/jsFiles/compileInBrowser.js", (req, res) => {
    const code = fs
      .readFileSync(coreDir + "/../compileInBrowser.js")
      .toString();
    res.end(code);
  });
  app.get("/jsFiles/babel-standalone.js", (req, res) => {
    const code = fs
      .readFileSync(coreDir + "/../babel-standalone.js")
      .toString();
    res.end(code);
  });

  // app.post("/setEnableInstrumentation", (req, res) => {
  //   const { enableInstrumentation } = req.body;
  //   getProxy().setEnableInstrumentation(enableInstrumentation);

  //   res.end(JSON.stringify(req.body));
  // });

  app.post("/storeLogs", (req, res) => {
    app.verifyToken(req);

    res.set("Access-Control-Allow-Origin", "*");
    res.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With"
    );

    // console.log("store logs", JSON.stringify(req.body, null, 2))

    const startTime = new Date();
    if (ENABLE_DERIVED) {
      req.body.logs.forEach((log) => {
        if (!locLogs[log.loc]) {
          console.log(
            "loc not found",
            log.loc,
            JSON.stringify(log).slice(0, 100)
          );
          return;
        }
        locLogs[log.loc].push(log.index);
      });

      req.body.logs.forEach((log) => {
        if (log.args) {
          if (Array.isArray(log.args)) {
            let args = log.args;
            for (const arg of args) {
              if (Array.isArray(arg)) {
                for (const a of arg) {
                  logUses[a] = logUses[a] || [];
                  logUses[a].push(log.index);
                }
              } else {
                logUses[arg] = logUses[arg] || [];
                logUses[arg].push(log.index);
              }
            }
          } else {
            Object.keys(log.args).forEach((argName) => {
              let argLogIndex = log.args[argName];
              logUses[argLogIndex] = logUses[argLogIndex] || [];
              logUses[argLogIndex].push(log.index);
            });
          }
        }
      });
    }
    logServer.storeLogs(req.body.logs, function () {
      const timePassed = new Date().valueOf() - startTime.valueOf();
      const timePer1000 =
        Math.round((timePassed / req.body.logs.length) * 1000 * 10) / 10;
      if (LOG_PERF) {
        console.log(
          "storing logs took " +
            timePassed +
            "ms, per 1000 logs: " +
            timePer1000 +
            "ms"
        );
      }
    });

    req.body.evalScripts.forEach(function (evalScript) {
      console.log(Object.keys(evalScript), evalScript.map);
      locStore.write(evalScript.locs, () => {});
      getRequestHandler()._afterCodeProcessed({
        fileKey: "eval-" + Math.random(),
        url: evalScript.url,
        raw: evalScript.code,
        instrument: evalScript.instrumentedCode,
      });
      // getProxy().registerEvalScript(evalScript);
    });

    // fs.writeFileSync("logs.json", JSON.stringify(logServer._storedLogs));
    // console.log("stored logs", req.body.logs.length);

    res.end(JSON.stringify({ ok: true }));
  });

  app.get("/loadLocForTest/:locId", async (req, res) => {
    locStore.getLoc(req.params.locId, (loc) => {
      resolver
        .resolveFrameFromLoc(loc, req.params.prettify === "prettify")
        .then((rr) => {
          res.json({ loc, rr });
        });
    });
  });

  app.get("/loadLogForTest/:logId", async (req, res) => {
    const log = await logServer.loadLogAwaitable(
      parseFloat(req.params.logId),
      1
    );
    res.json(log);
  });

  app.post("/loadLog", (req, res) => {
    // crude way to first wait for any new logs to be sent through...
    setTimeout(function () {
      // console.log(Object.keys(internalServerInterface._storedLogs));
      logServer.loadLog(req.body.id, function (err, log) {
        res.end(JSON.stringify(log));
      });
    }, 500);
  });

  app.post("/traverse", (req, res) => {
    const { logId, charIndex } = req.body;
    const tryTraverse = (previousAttempts = 0) => {
      logServer.hasLog(logId, (hasLog) => {
        if (hasLog) {
          finishRequest();
        } else {
          const timeout = 250;
          const timeElapsed = timeout * previousAttempts;
          if (timeElapsed > 5000) {
            res.status(500);
            res.end(
              JSON.stringify({
                err:
                  "Log not found (" + logId + ")- might still be saving data",
              })
            );
          } else {
            setTimeout(() => {
              tryTraverse(previousAttempts + 1);
            }, timeout);
          }
        }
      });
    };

    const finishRequest = async function finishRequest() {
      let steps;
      try {
        if (LOG_PERF) {
          console.time("Traverse " + logId);
        }
        steps = await traverse(
          {
            operationLog: logId,
            charIndex: charIndex,
          },
          [],
          logServer,
          { optimistic: true }
        );
        if (LOG_PERF) {
          console.timeEnd("Traverse " + logId);
        }
      } catch (err) {
        res.status(500);
        res.end(
          JSON.stringify({
            err: "Log not found in backend (" + logId + ")",
          })
        );
      }

      res.end(JSON.stringify({ steps }));
    };

    tryTraverse();
  });

  let resolver: StackFrameResolver;
  setTimeout(() => {
    resolver = new StackFrameResolver(getRequestHandler());
  }, 200);

  app.get("/resolveStackFrame/:loc/:prettify?", (req, res) => {
    locStore.getLoc(req.params.loc, (loc) => {
      resolver
        .resolveFrameFromLoc(loc, req.params.prettify === "prettify")
        .then((rr) => {
          res.end(JSON.stringify(rr, null, 4));
        });
    });
  });

  app.get("/viewFullCode/:url", (req, res) => {
    const url = decodeURIComponent(req.params.url);
    res.end(resolver.getFullSourceCode(url));
  });

  // app.post("/instrument", (req, res) => {
  //   const code = req.body.code;

  //   getProxy()
  //     .instrumentForEval(code)
  //     .then(babelResult => {
  //       res.end(
  //         JSON.stringify({ instrumentedCode: babelResult.instrumentedCode })
  //       );
  //     });
  // });

  return {
    storeLocs: (locs) => {
      Object.keys(locs).forEach((locKey) => {
        const loc = locs[locKey];
        // should use file key here, but we don't know the file hash....
        locLogs[locKey] = locLogs[locKey] || [];
      });
      locStore.write(locs, function () {});
    },
  };
}

function broadcast(wss, data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

function allowCrossOriginRequests(req, res) {
  allowCrossOrigin(res);
  res.end();
}

function allowCrossOrigin(res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With"
  );
}

export { BackendOptions };

function makeRequestHandler(options) {
  let defaultBlockList = [
    "inspectlet.com", // does a whole bunch of stuff that really slows page execution down
    "google-analytics.com",
    "newrelic.com", // overwrites some native functions used directly in FromJS (shouldn't be done ideally, but for now blocking is easier)
    "intercom.com",
    "segment.com",
    "bugsnag",
    "mixpanel",
    "piwik",
  ];

  return new RequestHandler({
    shouldInstrument: ({ url }) => {
      if (options.options.dontTrack.some((dt) => url.includes(dt))) {
        return false;
      }
      if (
        url.includes("product_registry_impl_module.js") &&
        url.includes("chrome-devtools-frontend")
      ) {
        // External file loaded by Chrome DevTools when opened
        return false;
      }
      let u = new URL(url);
      return (
        parseFloat(u.port) !== options.options.bePort ||
        u.pathname.startsWith("/start") ||
        u.pathname.startsWith("/fromJSInternal")
      );
    },
    shouldBlock: ({ url }) => {
      if (options.options.block.some((dt) => url.includes(dt))) {
        return true;
      }
      if (
        !options.options.disableDefaultBlockList &&
        defaultBlockList.some((dt) => url.includes(dt))
      ) {
        console.log(
          url +
            " blocked because it's on the default block list. You can disable this by passing in --disableDefaultBlockList"
        );
        return true;
      }
      return false;
    },
    backendPort: options.options.bePort,
    accessToken: options.accessToken,
    storeLocs: options.storeLocs,
    sessionDirectory: options.options.sessionDirectory,
    files: options.files,
    onCodeProcessed: ({ url, fileKey }) => {
      options.files.push({
        url,
        createdAt: new Date(),
        fileKey,
      });
    },
  });
}

export async function openBrowser({
  userDataDir,
  extraArgs,
  config,
  headless = false,
}) {
  let extensionPath = path.resolve(__dirname + "/../../proxy-extension/dist");
  const browser = await puppeteer.launch({
    headless: false,
    dumpio: true,
    ignoreDefaultArgs: ["--disable-extensions"],
    args: [
      `--js-flags="--max_old_space_size=8192"`,
      // "--proxy-server=127.0.0.1:" + proxyPort,
      "--disable-extensions-except=" + extensionPath,
      // "--load-extension=" + extensionPath,
      // "--ignore-certificate-errors",
      // "--test-type", // otherwise getting unsupported command line flag: --ignore-certificate-errors
      ...(userDataDir ? ["--user-data-dir=" + userDataDir] : []),
      "--disable-infobars", // disable "controlled by automated test software" message,
      "--allow-running-insecure-content", // load http inspector UI on https pages,
      ...extraArgs,
    ],
  });
  let pages = await browser.pages();
  const page = pages[0];
  // disable puppeteer default window size emulation
  await page._client.send("Emulation.clearDeviceMetricsOverride");
  // await page.goto("http://localhost:" + bePort + "/start");

  await page.goto(
    "http://localhost:" +
      config.backendPort +
      "/fromJSInitPage?config=" +
      encodeURIComponent(JSON.stringify(config))
  );
  return browser;
}

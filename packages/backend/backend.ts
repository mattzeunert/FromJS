import {
  LevelDBLogServer,
  HtmlToOperationLogMapping,
  LocStore,
  LocLogs,
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
import { BackendOptions } from "./BackendOptions";
import * as responseTime from "response-time";
import { config } from "@fromjs/core";
import { RequestHandler } from "./RequestHandler";
import * as puppeteer from "puppeteer";
import { initSessionDirectory } from "./initSession";
import { compileNodeApp } from "./compileNodeApp";
import * as axios from "axios";

const ENABLE_DERIVED = false;
const SAVE_LOG_USES = false;
const GENERATE_DERIVED = false;

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

if (LOG_PERF) {
  require("./timeJson");
}

async function generateLocLogs({ logServer, locLogs }) {
  console.log("will generate locLogs");
  await new Promise((resolve) => locLogs._db.clear(resolve));

  console.time("Couting logs");
  let totalLogs = (await new Promise((resolve) => {
    let totalLogs = 0;
    let i = logServer.db.iterator();
    function iterate(error, key, value) {
      if (value) {
        totalLogs++;
        i.next(iterate);
      } else {
        resolve(totalLogs);
      }
    }
    i.next(iterate);
  })) as number;
  console.timeEnd("Couting logs");

  console.log({ totalLogs });
  console.time("generateLocLogs");

  return new Promise((resolve, reject) => {
    let locs: any[] = [];
    let num = 0;
    let i = logServer.db.iterator();

    let locLogsToSave = {};
    async function doAdd() {
      let locIds = Object.keys(locLogsToSave);
      for (const locId of locIds) {
        await locLogs.addLogs(locId, locLogsToSave[locId]);
      }
      locLogsToSave = {};
    }
    async function iterate(error, key, value) {
      num++;
      if (num % 50000 === 0) {
        await doAdd();
        console.log({ num, p: Math.round((num / totalLogs) * 1000) / 10 });
      }
      if (value) {
        value = JSON.parse(value);

        locLogsToSave[value.loc] = locLogsToSave[value.loc] || [];
        locLogsToSave[value.loc].push(value.index);
        i.next(iterate);
      } else {
        await doAdd();
        console.timeEnd("generateLocLogs");
        resolve();
      }

      // if (value) {
      //   value = JSON.parse(value);
      //   if (value.url.includes(url)) {
      //     locs.push({ key: key.toString(), value });
      //   }
      // }
      // if (key) {
      //   i.next(iterate);
      // } else {
      //   resolve(locs);
      // }
    }
    i.next(iterate);
  });

  // for (const log of req.body.logs) {
  //   await locLogs.addLog(log.loc, log.index);
  // }
  // console.timeEnd(id);
}

export default class Backend {
  sessionConfig = null;
  constructor(private options: BackendOptions) {
    console.time("create backend");

    if (DELETE_EXISTING_LOGS_AT_START) {
      console.log(
        "deleting existing log data, this makes sure perf data is more comparable... presumably leveldb slows down with more data"
      );
      require("rimraf").sync(options.getLocStorePath());
      require("rimraf").sync(options.getTrackingDataDirectory());
    }
    initSessionDirectory(options);

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
      console.log("Saved session config");
    }
    this.sessionConfig = sessionConfig;

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

    app.use(bodyParser.json({ limit: "500mb" }));

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
          "Token invalid: " +
            authorization +
            " should be " +
            accessToken +
            ` | Request: ${req.method} + ${req.path}`
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

    const locLogs = new LocLogs(options.sessionDirectory + "/locLogs");

    const logUses = fs.existsSync(options.sessionDirectory + "/logUses.json")
      ? JSON.parse(
          fs.readFileSync(
            options.sessionDirectory + "/" + "logUses.json",
            "utf-8"
          )
        )
      : {};

    let requestHandler;

    const locStore = new LocStore(options.getLocStorePath());

    const logServer = new LevelDBLogServer(
      options.getTrackingDataDirectory(),
      locStore
    );
    if (GENERATE_DERIVED) {
      generateLocLogs({ logServer, locLogs });
      generateUrlLocs({ locStore, options });
    }

    let { storeLocs } = setupBackend(
      options,
      app,
      wss,
      getProxy,
      files,
      locLogs,
      logUses,
      () => requestHandler,
      locStore,
      logServer
    );
    setupUI(options, app, wss, getProxy, files, () => requestHandler);

    requestHandler = makeRequestHandler({
      accessToken: sessionConfig.accessToken,
      options,
      storeLocs,
      files,
    });

    if (process.env.NODE_TEST) {
      compileNodeApp({
        directory: "node-test",
        outdir: "node-test-compiled",
        requestHandler: requestHandler,
      });
    }

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
      options.onReady({ requestHandler, logServer });
    });
  }

  async processRequestQueue() {
    const queueFiles = fs.readdirSync(
      this.options.sessionDirectory + "/requestQueue"
    );
    console.log({ queueFiles });
    for (const queueFile of queueFiles) {
      let filePath =
        this.options.sessionDirectory + "/requestQueue/" + queueFile;
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");

      await axios({
        url: "http://localhost:" + this.options.bePort + lines[0],
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: (this.sessionConfig! as any).accessToken,
        },
        data: lines[1],
      });
    }
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

  app.get("/sessionInfo", (req, res) => {
    console.log("req to /sessionInfo");
    res.json({
      requestQueueDirectory: options.sessionDirectory + "/requestQueue",
    });
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
}

function getUrlLocsPath(options: BackendOptions, url) {
  return (
    options.sessionDirectory + "/locsByUrl/" + url.replace(/[^a-zA-Z0-9]/g, "_")
  );
}

async function generateUrlLocs({
  locStore,
  options,
}: {
  locStore: LocStore;
  options: BackendOptions;
}) {
  return new Promise((resolve, reject) => {
    let locsByUrl = {};
    let i = locStore.db.iterator();
    function iterate(error, key, value) {
      if (value) {
        value = JSON.parse(value);
        locsByUrl[value.url] = locsByUrl[value.url] || [];
        locsByUrl[value.url].push(key.toString());
      }
      if (key) {
        i.next(iterate);
      } else {
        for (const url of Object.keys(locsByUrl)) {
          fs.writeFileSync(
            getUrlLocsPath(options, url),
            JSON.stringify(locsByUrl[url], null, 2)
          );
        }
        console.log("Done generate url locs");
      }
    }
    i.next(iterate);
  });
}

function setupBackend(
  options: BackendOptions,
  app,
  wss,
  getProxy,
  files,
  locLogs,
  logUses,
  getRequestHandler,
  locStore: LocStore,
  logServer: LevelDBLogServer
) {
  function getLocs(url) {
    return JSON.parse(fs.readFileSync(getUrlLocsPath(options, url), "utf-8"));
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

    const locKeys = (await getLocs(url)) as any;

    const locs = await Promise.all(
      locKeys.map(async (locKey) => {
        let loc = (await new Promise((resolve) =>
          locStore.getLoc(locKey, resolve)
        )) as any;
        let logs = await locLogs.getLogs(locKey);
        loc.logCount = logs.length;
        loc.key = locKey;
        return loc;
      })
    );

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
    // let locs = (await getLogs(req.params.locId)) as any;
    let logs = await locLogs.getLogs(req.params.locId);
    console.timeEnd("get logs");
    console.log(logs);
    logs = await Promise.all(
      logs.map(async (logIndex) => {
        let v2;
        try {
          v2 = await logServer.loadLogAwaitable(parseFloat(logIndex), 0);
        } catch (err) {
          return null;
        }
        return {
          key: logIndex,
          value: v2,
        };
      })
    );
    logs = logs.filter((l) => !!l);
    res.json(logs);
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

  app.post("/storeLogs", async (req, res) => {
    app.verifyToken(req);

    res.set("Access-Control-Allow-Origin", "*");
    res.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With"
    );

    // console.log("store logs", JSON.stringify(req.body, null, 2))

    const startTime = new Date();
    if (ENABLE_DERIVED) {
      let id = "addLogs_" + Math.random();
      console.time(id);
      for (const log of req.body.logs) {
        await locLogs.addLog(log.loc, log.index);
      }
      console.timeEnd(id);

      if (SAVE_LOG_USES) {
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
    }

    req.body.evalScripts.forEach(function (evalScript) {
      locStore.write(evalScript.locs, () => {});
      getRequestHandler()._afterCodeProcessed({
        url: evalScript.url,
        raw: evalScript.code,
        instrument: evalScript.instrumentedCode,
        fileKey: "eval-" + Math.random(),
        details: evalScript.details,
      });
      // getProxy().registerEvalScript(evalScript);
    });

    console.log("skip_save", !!process.env.SKIP_SAVE);
    if (!process.env.SKIP_SAVE) {
      await new Promise((resolve) =>
        logServer.storeLogs(req.body.logs, function () {
          const timePassed = new Date().valueOf() - startTime.valueOf();

          console.log("stored logs", req.body.logs.length);

          if (LOG_PERF) {
            const timePer1000 =
              Math.round((timePassed / req.body.logs.length) * 1000 * 10) / 10;
            console.log(
              "storing logs took " +
                timePassed +
                "ms, per 1000 logs: " +
                timePer1000 +
                "ms"
            );
          }
          resolve();
        })
      );
    }

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

        while (true) {
          let lastStep = steps[steps.length - 1];

          console.log("last step op", lastStep.operationLog.operation);
          if (
            lastStep.operationLog.operation !== "stringLiteral" &&
            lastStep.operationLog.operation !== "templateLiteral" &&
            lastStep.operationLog.operation !== "initialPageHtml"
          ) {
            // if e.g. it's a localstorage value then we don't want to
            // inspect the code for it!!
            // really mostly just string literal has that kind of sensible mapping
            break;
          }

          let overwriteFile: any = null;
          if (lastStep.operationLog.operation === "initialPageHtml") {
            break;
            overwriteFile = {
              url:
                "http://localhost:4444/example.com_2020-04-29_16-17-05.report.html",
              sourceOperationLog: 949871490803662,
              sourceOffset: 0,
            };
          } else if (!lastStep.operationLog.loc) {
            break;
          }

          let loc;

          if (overwriteFile) {
            loc = {
              url: overwriteFile.url,
              start: {
                line: 1,
                column: 0,
              },
            };
          } else if (lastStep.operationLog.loc) {
            loc = (await new Promise((resolve) =>
              locStore.getLoc(lastStep.operationLog.loc, (loc) => resolve(loc))
            )) as any;
          }

          let file = files.find((f) => f.url === loc.url);
          if (overwriteFile) {
            file = overwriteFile;
          }
          if (file.sourceOperationLog) {
            // const log = await logServer.loadLogAwaitable(
            //   file.sourceOperationLog,
            //   1
            // );

            let { body: fileContent } = await getRequestHandler().handleRequest(
              {
                url: loc.url + "?dontprocess",
                method: "GET",
                headers: {},
              }
            );
            let lineColumn = require("line-column");
            let charIndex =
              lineColumn(fileContent.toString()).toIndex({
                line: loc.start.line,
                column: loc.start.column + 1, // lineColumn uses origin of 1, but babel uses 0
              }) +
              file.sourceOffset +
              lastStep.charIndex;

            // // this makes stuff better... maybe it adjusts for the quote sign for string literals in the code?
            charIndex++;

            console.log("will traverse", file);
            let s = (await traverse(
              {
                operationLog: file.sourceOperationLog,
                charIndex,
              },
              [],
              logServer,
              { optimistic: true }
            )) as any;

            steps = [...steps, ...s];
            console.log("####");
          } else {
            break;
          }
        }

        if (LOG_PERF) {
          console.timeEnd("Traverse " + logId);
        }
      } catch (err) {
        console.log(err);
        res.status(500);
        res.end(
          JSON.stringify({
            err: "Log not found in backend, or other error(" + logId + ")",
          })
        );
      }

      steps.forEach((step, i) => {
        Object.keys(step.operationLog.args).forEach((key) => {
          if (!step.operationLog.args[key]) {
            return;
          }

          let r = step.operationLog.args[key]._result;
          if (typeof r === "string" && r.length > 10000) {
            step.operationLog.args[key]._result = "";
          }
        });
        Object.keys(step.operationLog.extraArgs || {}).forEach((key) => {
          if (!step.operationLog.extraArgs[key]) {
            return;
          }

          let r = step.operationLog.extraArgs[key]._result;
          if (typeof r === "string" && r.length > 10000) {
            step.operationLog.extraArgs[key]._result = "";
          }
        });
        if (i < steps.length - 2) {
          step.operationLog._result = "";
        }
      });

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
    storeLocs: async (locs) => {
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
    onCodeProcessed: ({ url, fileKey, details }) => {
      options.files.push({
        url,
        createdAt: new Date(),
        fileKey,
        nodePath: details && details.nodePath,
        sourceOperationLog: details && details.sourceOperationLog,
        sourceOffset: details && details.sourceOffset,
      });
      fs.writeFileSync(
        options.options.sessionDirectory + "/files.json",
        JSON.stringify(options.files, null, 2)
      );
    },
  });
}

export async function openBrowser({ userDataDir, extraArgs, config }) {
  let extensionPath = path.resolve(__dirname + "/../../proxy-extension/dist");
  const browser = await puppeteer.launch({
    headless: false,
    dumpio: true,
    ignoreDefaultArgs: ["--disable-extensions"],
    args: [
      `--js-flags="--max_old_space_size=8192"`,
      // "--proxy-server=127.0.0.1:" + proxyPort,
      // "--disable-extensions-except=" + extensionPath,
      "--load-extension=" + extensionPath,
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

  console.log("will wait 2s");
  await page.waitFor(2000);
  await page.goto(
    "http://localhost:" +
      config.backendPort +
      "/fromJSInitPage?config=" +
      encodeURIComponent(JSON.stringify(config))
  );
  console.log("will wait 2s");
  await page.waitFor(2000);

  console.log("PAGE: ", page.url());
  console.log("Created browser", { config });
  return browser;
}

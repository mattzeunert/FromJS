import { babelPlugin, InMemoryLogServer as ServerInterface } from "@fromjs/core";
import { traverse } from "./src/traverse";
import StackFrameResolver from "./src/StackFrameResolver";
import * as fs from "fs";
import * as prettier from 'prettier'
import { startProxy } from '@fromjs/proxy-instrumenter'
import * as Babel from 'babel-core'

const express = require("express");
const bodyParser = require("body-parser");

const internalServerInterface = new ServerInterface();

let json = fs.readFileSync("logs.json").toString()
if (json === "") {
  json = "{}"
}
internalServerInterface._storedLogs = JSON.parse(
  json
);

const app = express();

app.use(bodyParser.json({ limit: "50mb" }));

app.post("/", (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With"
  );

  req.body.logs.forEach(function (log) {
    internalServerInterface.storeLog(log);
  });

  fs.writeFileSync(
    "logs.json",
    JSON.stringify(internalServerInterface._storedLogs)
  );
  console.log("stored logs", req.body.logs.length);

  res.end(JSON.stringify({ ok: true }));
});

app.post("/loadLog", (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With"
  );

  // crude way to first wait for any new logs to be sent through...
  setTimeout(function () {
    // console.log(Object.keys(internalServerInterface._storedLogs));
    console.log(req.body);
    internalServerInterface.loadLog(req.body.id, function (log) {
      res.end(JSON.stringify(log));
    });
  }, 500);
});

app.post("/traverse", (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With"
  );

  // crude way to first wait for any new logs to be sent through...
  setTimeout(async function () {
    console.log("traverse", req.body);
    console.time("loading log for traverse")

    internalServerInterface.loadLog(req.body.logId, async function (log) {
      console.timeEnd("loading log for traverse")
      var steps = await traverse({
        operationLog: log,
        charIndex: req.body.charIndex
      }, [], internalServerInterface);

      res.end(JSON.stringify({ steps }))
    });


  }, 500);
});

const resolver = new StackFrameResolver();

app.post("/resolveStackFrame", (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With"
  );

  const frameString = req.body.stackFrameString;

  const operationLog = req.body.operationLog

  // use loc if available because sourcemaps are buggy...
  if (operationLog.loc) {
    resolver.resolveFrameFromLoc(frameString, operationLog.loc).then(rr => {
      res.end(JSON.stringify(rr));
    });
  } else {
    resolver.resolveFrame(frameString).then(rr => {
      res.end(JSON.stringify(rr));
    });
  }
});

["/loadLog", "/", "/traverse", "/resolveStackFrame"].forEach(path => {
  // todo: don't allow requests from any site
  app.options(path, (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With"
    );
    // console.log(req.body);
    res.end();
  });
});




app.post("/prettify", (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With"
  );

  res.end(JSON.stringify({ code: prettier.format(req.body.code) }));
});

app.options("/prettify", (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With"
  );
  // console.log(req.body);
  res.end();
});





app.post("/instrument", (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With"
  );

  const url = "http://localhost:11111/eval" + Math.floor(Math.random() * 10000000000) + ".js"

  const code = req.body.code

  var babelResult = Babel.transform(code, {
    plugins: [babelPlugin],
    sourceMaps: true
  });

  const evalScriptCode = code
  // debugger
  proxy.registerEvalScript(url, evalScriptCode, babelResult)


  console.log(babelResult.code.split("* HELPER_FUNCTIONS_END */")[1])

  const instrumentedCode = babelResult.code + "\n//# sourceURL=" + url
  res.end(JSON.stringify({ instrumentedCode }));
});

app.options("/instrument", (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With"
  );


  res.end()
});



app.listen(4556, () => console.log("server listening on port 4556!"));





var proxy
startProxy().then(p => proxy = p)

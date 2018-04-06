import ServerInterface from "../ServerInterface";
import traverse from "../traverse";

const express = require("express");
const bodyParser = require("body-parser");

const internalServerInterfce = new ServerInterface();

const app = express();

app.use(bodyParser.json({ limit: "50mb" }));

app.post("/", (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With"
  );

  req.body.logs.forEach(function(log) {
    internalServerInterfce.storeLog(log);
  });

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
  setTimeout(function() {
    console.log(Object.keys(internalServerInterfce._storedLogs));
    console.log(req.body);
    internalServerInterfce.loadLog(req.body.id, function(log) {
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
  setTimeout(function() {
    console.log("traverse", req.body);
    internalServerInterfce.loadLog(req.body.logId, function(log) {
      var ret = traverse(log, req.body.charIndex);

      res.end(JSON.stringify({ steps: ret }));
    });
  }, 500);
});

["/loadLog", "/", "/traverse"].forEach(path => {
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

app.listen(4556, () => console.log("server listening on port 4556!"));

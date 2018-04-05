import ServerInterface from "../ServerInterface";

const express = require("express");
const bodyParser = require("body-parser");

const internalServerInterfce = new ServerInterface()

const app = express();

app.use(bodyParser.json({ limit: '50mb' }));

app.post("/", (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With"
  );

  req.body.logs.forEach(function (log) {
    internalServerInterfce.storeLog(log)
  })

  console.log("stored logs", req.body.logs.length)

  res.end(JSON.stringify({ ok: true }))
});

app.post("/loadLog", (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With"
  );

  // crude way to first wait for any new logs to be sent through...
  setTimeout(function () {

    console.log(Object.keys(internalServerInterfce._storedLogs))
    console.log(req.body)
    internalServerInterfce.loadLog(req.body.id, function (log) {
      res.end(JSON.stringify(log))
    })
  }, 2000)

});

// todo: don't allow requests from any site
app.options("/loadLog", (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With"
  );
  // console.log(req.body);
  res.end();
});

// todo: don't allow requests from any site
app.options("/", (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With"
  );
  // console.log(req.body);
  res.end();
});

app.listen(4556, () => console.log("server listening on port 4556!"));

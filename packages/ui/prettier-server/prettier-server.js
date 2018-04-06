const express = require("express");
const bodyParser = require("body-parser");
const prettier = require("prettier");

const app = express();

app.use(bodyParser.json());

app.post("/", (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With"
  );

  res.end(JSON.stringify({ code: prettier.format(req.body.code) }));
});

app.options("/", (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With"
  );
  // console.log(req.body);
  res.end();
});

app.listen(4555, () => console.log("Prettier server listening on port 4555!"));

// Put code you want to compile in babel-plugin-data-flow/test.js
// run in babel-plugin-data-flow direcotry: ts-node src/testPlugin.ts

import compile from "./compile";
import * as fs from "fs";

var code = fs.readFileSync("test.js");
compile(code).then(function({ code }) {
  console.log("..." + code.split("/* HELPER_FUNCTIONS_END */")[1]);
});

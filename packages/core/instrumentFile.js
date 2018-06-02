// file used for instrumenting individual files for testing

const process = require("process");
const fs = require("fs");
const compile = require("./dist/src/compile").default;

const filePathToInstrument = process.argv[2];
const fileContent = fs.readFileSync(filePathToInstrument);
console.log(
  "File size before: " + Math.round(fileContent.length / 1024) + "kb"
);

compile(fileContent).then(result => {
  const instrumentedCode = result.code;
  console.log(
    "File size after: " + Math.round(instrumentedCode.length / 1024) + "kb"
  );
  fs.writeFileSync(filePathToInstrument + ".instrumented.js", instrumentedCode);
});

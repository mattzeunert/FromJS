// Prettier would make the code look better, but it's many times slower than pretty-fast
// function prettifyAndMapFrameObject(code, frameObject) {
//   console.time("Prettify");
//   var prettier = require("prettier");
//   var lines = code.split("\n").slice(0, frameObject.lineNumber - 1);
//   var cursorOffset = frameObject.columnNumber + lines.length * "\n".length;
//   lines.forEach(function(line) {
//     cursorOffset += line.length;
//   });

//   var {
//     formatted,
//     cursorOffset: cursorOffsetAfter
//   } = prettier.formatWithCursor(code, {
//     cursorOffset
//   });

//   var prettyLines = formatted.split("\n");
//   var mappedColumnNumber = cursorOffsetAfter;
//   var mappedLineNumber = 1;
//   while (mappedColumnNumber > prettyLines[0].length) {
//     mappedColumnNumber -= prettyLines[0].length + "\n".length;
//     mappedLineNumber++;
//     prettyLines.shift();
//   }

//   var mappedFrameObject = {
//     fileName: frameObject.fileName + " (prettified)",
//     lineNumber: mappedLineNumber,
//     columnNumber: mappedColumnNumber
//   };

//   console.timeEnd("Prettify");

//   return {
//     formatted,
//     mappedFrameObject
//   };
// }

var prettyFast = require("pretty-fast");
var sourceMap = require("source-map");

var cache = {};
async function prettifyAndMapFrameObject(code, frameObject) {
  var pretty = cache[code];
  if (!pretty) {
    let unprettifiedCode = code;
    var { code, map } = prettyFast(code, {
      indent: "  ",
      url: "meaningless.js",
      columnLevelMapAccuracy: true
    });

    pretty = {
      code,
      consumer: await new sourceMap.SourceMapConsumer(map.toString())
    };
    cache[unprettifiedCode] = pretty;
  }

  var generatedPosition = pretty.consumer.generatedPositionFor({
    source: "meaningless.js",
    line: frameObject.lineNumber,
    column: frameObject.columnNumber
  });

  return {
    formatted: pretty.code,
    mappedFrameObject: {
      fileName: frameObject.fileName + " (prettified)",
      lineNumber: generatedPosition.line,
      columnNumber: generatedPosition.column
    }
  };
}

export { prettifyAndMapFrameObject };

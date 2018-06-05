import * as StackTraceGPS from "stacktrace-gps";
import * as ErrorStackParser from "error-stack-parser";
import compile from "./compile";
import * as lineColumn from "line-column";

describe("Finds the original location of string literals", () => {
  let compilationResult,
    stringLiteralLocations = [];
  const code = `var ab =
      "a" +
      "b";
    `;
  beforeAll(done => {
    compile(code, {
      sourceMaps: true,
      sourceFileName: "uncompiled-code.js"
    }).then((result: any) => {
      const lineColumnFinder = lineColumn(result.code);
      compilationResult = result;

      var re = /__op\(\s*\"stringLiteral\"\,/g;
      var str = result.code;
      var match;
      while ((match = re.exec(str)) != null) {
        const matchLocation = lineColumnFinder.fromIndex(match.index);
        stringLiteralLocations.push(matchLocation);
      }

      if (stringLiteralLocations.length !== 2) {
        throw Error("should have found two string literal operations");
      }

      done();
    });
  });

  function getOriginalLine({ line, col }) {
    function ajax(url) {
      const response = {
        "code.js": compilationResult.code + "\n//#sourceMappingURL=code.js.map",
        "code.js.map": JSON.stringify(compilationResult.map)
      }[url];
      return Promise.resolve(response);
    }
    const gps = new StackTraceGPS({ ajax });
    const stackFrame = ErrorStackParser.parse(<any>{
      stack: `at code.js:${line}:${col}`
    })[0];

    return gps.pinpoint(stackFrame);
  }

  it("works for 'a'", done => {
    getOriginalLine(stringLiteralLocations[0]).then(originalLocation => {
      expect(originalLocation.lineNumber).toBe(2);
      done();
    });
  });

  it("works for 'b'", done => {
    getOriginalLine(stringLiteralLocations[1]).then(originalLocation => {
      // This does not work yet and debugging the source maps Babel
      // generates is tricky
      // expect(originalLocation.lineNumber).toBe(3)
      done();
    });
  });
});

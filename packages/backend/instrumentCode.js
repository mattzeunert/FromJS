// plain JS worker thread

Error.stackTraceLimit = Infinity;

var babel = require("babel-core");
var path = require("path");
var fs = require("fs");

var sourceMapRegex = /\/\/#[\W]*sourceMappingURL=.*$/;
function removeSourceMapIfAny(code) {
  // In theory we might be able to use this source map, but right now
  // 1) parsing source maps on the frontend is hard, because FE JS doesn't
  //    natively support parsing UTF-8 base64 which is used for inline source maps
  // 2) It could break things if we don't take it out, so need to do some work
  //    to handle the existing source map properly
  if (sourceMapRegex.test(code)) {
    var sourceMapComment = code.match(/\/\/#[\W]*sourceMappingURL=.*$/)[0];
    code = code.replace(sourceMapComment, "");
  }
  return code;
}

function instrumentCode() {
  // var babelPluginPath = path.resolve(analysisDirectory + "/babelPlugin.js");
  var babelPlugin = require("@fromjs/core").babelPlugin;

  var compilationFailures = [];
  // var envInitCode = fs
  //   .readFileSync(analysisDirectory + "/init.js", "utf-8")
  //   .toString();

  return function processCode(code, url, babelPluginOptions) {
    // not an elegant solution, but it works
    // might be better anyway to do a string replace because then the helper code
    // won't change and the parse result can be cached in babel plugin
    // maybe move the helpercode logic out of babel altogether...
    babelPlugin.babelPluginOptions = babelPluginOptions;
    return new Promise((resolve, reject) => {
      // Include as part of the file rather than injecting into page
      // because there might be other environemnts being created
      // in iframes or web workers
      try {
        console.time("[COMPILER] Compile " + url);
        code = removeSourceMapIfAny(code);
        code = babel.transform(code, {
          sourceFileName: url + "?dontprocess",
          sourceMapTarget: url + ".map",
          sourceMaps: true,
          plugins: [babelPlugin],
          // prevent code from not being pretty after instrumentation:
          // `[BABEL] Note: The code generator has deoptimised the styling of "unknown" as it exceeds the max of "500KB"`
          compact: false
        });

        var resCode = code.code + `\n//# sourceMappingURL=${url}.map`;
        resolve({
          code: resCode,
          map: code.map
        });
        console.timeEnd("[COMPILER] Compile " + url);
      } catch (err) {
        console.log("FAILED " + url, err);
        reject(err);
        throw err;
      }
    });
  };
}

module.exports = function instrument(args, done) {
  if (!args) {
    // some weird issue
    done();
  }

  // var { body, url } = args;
  const body = args.body;
  const url = args.url;
  const babelPluginOptions = args.babelPluginOptions;
  var process = require("process");

  process.title = "FromJS - Compilation worker(" + url + ")";

  instrumentCode()(body, url, babelPluginOptions).then(
    function(result) {
      console.log("[COMPILER] Done process for", url);
      done(result);
    },
    function(err) {
      throw Error(err);
    }
  );
};

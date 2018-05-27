var instrumentCode = require("./instrumentCode");

Error.stackTraceLimit = Infinity;

module.exports = function instrument(args, done) {
  if (!args) {
    // some weird issue
    done();
  }

  // var { body, url } = args;
  const body = args.body;
  const url = args.url;
  const babelPluginOptions = args.babelPluginOptions;
  var path = require("path");
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

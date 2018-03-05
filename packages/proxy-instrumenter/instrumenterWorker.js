var instrumentCode = require("./instrumentCode");

module.exports = function instrument(args, done) {
  console.log("---");
  console.log("args", args);
  if (!args) {
    // some weird issue
    done();
  }

  console.log(typeof args, Object.keys(args), "a", args, "b", args.body);
  // var { body, url } = args;
  const body = args.body;
  const url = args.url;
  var path = require("path");
  var process = require("process");

  process.title = "FromJS - Compilation worker(" + url + ")";

  instrumentCode()(body, url).then(
    function(result) {
      console.log("[COMPILER] Done process for", url);
      done(result);
    },
    function(err) {
      throw Error(err);
    }
  );
};

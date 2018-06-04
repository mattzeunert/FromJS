/* compileInBrowser depends on the compiled helperFunctions file, so this has to run first. */

const config = require("./webpack.config.js");
config.entry = {
  helperFunctions: config.entry.helperFunctions
};
module.exports = config;

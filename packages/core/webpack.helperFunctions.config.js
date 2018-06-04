const config = require("./webpack.config.js");
config.entry = {
  helperFunctions: config.entry.helperFunctions
};
module.exports = config;

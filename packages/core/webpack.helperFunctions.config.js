/* compileInBrowser depends on the compiled helperFunctions file, so this has to run first. */

let configs = require("./webpack.config.js");
configs = configs.map(config => {
  return {
    ...config,
    entry: {
      helperFunctions: config.entry.helperFunctions
    }
  };
})

module.exports = configs;

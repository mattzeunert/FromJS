console.log("reading config");

function AfterEmitPlugin(fn) {
  console.log("init plugin");
  this.fn = fn;
}

AfterEmitPlugin.prototype.apply = function(compiler) {
  const fn = this.fn;

  compiler.plugin("emit", (compilation, callback) => {
    console.log("emit");
    fn();

    callback();
  });
};

module.exports = {
  entry: {
    helperFunctions: "./src/helperFunctions/helperFunctions.ts",
    compileInBrowser: "./src/compileInBrowser.ts"
  },
  output: {
    filename: "[name].js",
    path: __dirname
  },

  optimization: {
    minimize: false
  },

  // devtool: "source-map",

  resolve: {
    extensions: [".ts", ".tsx", ".js", ".json"]
  },

  plugins: [
    new AfterEmitPlugin(function() {
      setTimeout(function() {
        const fs = require("fs");
        var code = fs.readFileSync("./helperFunctions.js").toString();
        code = `export default \`${code}\``;
        const currentTsFile = fs
          .readFileSync("./helperFunctions.ts")
          .toString();

        // prevent infinite webpack builds (overwriting helperfunctins triggers rebuild as compileInBrowser depends on it)
        if (currentTsFile !== code) {
          fs.writeFileSync("./helperFunctions.ts", code);
          console.log("updated");
        }
      }, 1000);
    })
  ],

  module: {
    rules: [{ test: /\.tsx?$/, loader: "ts-loader" }]
  },

  externals: {}
};

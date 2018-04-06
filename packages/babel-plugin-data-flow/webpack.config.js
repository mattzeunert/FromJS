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
  entry: "./src/helperFunctions/helperFunctions.ts",
  output: {
    filename: "helperFunctions.js",
    path: __dirname + "/dist"
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
        var code = fs.readFileSync("./dist/helperFunctions.js").toString();
        code = `module.exports = \`${code}\``;
        fs.writeFileSync("./dist/helperFunctions.js", code);
        console.log("updated");
      }, 1000);
    })
  ],

  module: {
    rules: [{ test: /\.tsx?$/, loader: "ts-loader" }]
  },

  externals: {}
};

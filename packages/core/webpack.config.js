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
    filename: "helperFunctions.ts",
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
        var code = fs.readFileSync("./helperFunctions.ts").toString();
        code = `export default \`${code}\``;
        fs.writeFileSync("./helperFunctions.ts", code);
        console.log("updated");
      }, 1000);
    })
  ],

  module: {
    rules: [{ test: /\.tsx?$/, loader: "ts-loader" }]
  },

  externals: {}
};

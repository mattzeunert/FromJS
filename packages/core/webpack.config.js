console.log("reading config");

function AfterEmitPlugin(fn) {
  console.log("init plugin");
  this.fn = fn;
}

AfterEmitPlugin.prototype.apply = function (compiler) {
  const fn = this.fn;

  compiler.plugin("emit", (compilation, callback) => {
    console.log("emit");
    fn();

    callback();
  });
};

function makeTarget(target) {
  let filePostfix = target === "node" ? "" : "_browser"
  let config = {
    entry: {
      helperFunctions: "./src/helperFunctions/helperFunctions.ts",
      compileInBrowser: "./src/compileInBrowser.ts"
    },
    output: {
      filename: `[name]${filePostfix}.js`,
      path: __dirname,
      globalObject: `(typeof window === "undefined" ? Function("return this")() : window)`
    },

    target,

    optimization: {
      // Minimize because hopefully that'll speed up execution a bit,
      // e.g. I think V8 decides function inlining based on code size sometimes
      minimize: true
    },

    // devtool: "source-map",

    resolve: {
      extensions: [".ts", ".tsx", ".js", ".json"]
    },

    performance: { hints: false },

    // i think right now prod doesn't work for node?
    mode: "development",

    plugins: [
      new AfterEmitPlugin(function () {
        setTimeout(function () {
          const fs = require("fs");
          var code = fs.readFileSync(`./helperFunctions${filePostfix}.js`).toString();
          code = code.replace(/\\/g, "MARKER_BACKSLASH");
          code = code.replace(/`/g, "MARKER_BACKTICK");
          code = code.replace(/\$/g, "MARKER_DOLLAR");
          code = `
            let code = \`${code}\`;
            code = code.replace(/MARKER_BACKSLASH/g, "\\\\").replace(/MARKER_BACKTICK/g, "\\\`").replace(/MARKER_DOLLAR/g, "\\$");
            export default code
          `;

          let currentTsFile;
          try {
            currentTsFile = fs.readFileSync(`./helperFunctions${filePostfix}.ts`).toString();
          } catch (err) { }

          // prevent infinite webpack builds (overwriting helperfunctins triggers rebuild as compileInBrowser depends on it)
          if (currentTsFile !== code) {
            fs.writeFileSync(`./helperFunctions${filePostfix}.ts`, code);
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

  console.log(config.output)

  return config

}

module.exports = [
  makeTarget(undefined),
  makeTarget("node")
]
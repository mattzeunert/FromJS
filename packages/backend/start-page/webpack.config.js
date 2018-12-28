module.exports = {
  entry: "./src/start.tsx",
  output: {
    filename: "bundle.js",
    path: __dirname + "/dist"
  },

  optimization: {
    minimize: true
  },

  devtool: "source-map",
  mode: "production",

  resolve: {
    extensions: [".ts", ".tsx", ".js", ".json"]
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader"
      }
    ]
  },

  externals: {}
};

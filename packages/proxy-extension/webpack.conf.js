const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");

function srcPath(subdir) {
  return path.join(__dirname, subdir);
}

try {
  process.title = "Node - Load archive webpack";
} catch (err) { }

module.exports = {
  entry: {
    background: "./background.ts",
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname + "/dist")
  },
  plugins: [
    new webpack.EnvironmentPlugin(["NODE_ENV"]),
    new CopyWebpackPlugin(
      ["manifest.json", "logo.png"].map(file => ({
        from: "./" + file,
        to: "./" + file
      }))
    )
  ],
  resolve: {
    extensions: [".ts", ".js"],
  },
  devtool: "none",
  mode: process.env.NODE_ENV || "development",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: "ts-loader",
          options: {
            transpileOnly: true
          }
        },

        exclude: /node_modules/
      }
    ]
  }
};

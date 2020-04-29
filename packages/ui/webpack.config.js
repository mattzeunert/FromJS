const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');


module.exports = {
  entry: "./src/index.tsx",
  output: {
    filename: "bundle.js",
    path: __dirname + "/dist",
    publicPath: "/dist/"
  },

  performance: { hints: false },

  mode: "production",

  optimization: {
    minimize: false
  },

  // devtool: "source-map",

  resolve: {
    extensions: [".ts", ".tsx", ".js", ".json"]
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/, loader: "ts-loader",
        // transpileOnly to fix build with monaco
        options: { transpileOnly: true }
      },

      { enforce: "pre", test: /\.js$/, loader: "source-map-loader", },


      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }, {
        test: /\.ttf$/,
        use: ['file-loader']
      },

      {
        test: /\.scss$/,
        use: [
          "style-loader", // creates style nodes from JS strings
          "css-loader", // translates CSS into CommonJS
          "sass-loader" // compiles Sass to CSS
        ]
      }
    ]
  },

  plugins: [new MonacoWebpackPlugin({ languages: ["javascript"] })],

  externals: {
    // babel plugins try to use fs
    fs: "commonjs fs",
  }
};

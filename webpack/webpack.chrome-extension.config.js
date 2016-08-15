var webpack = require('webpack');
var WebpackShellPlugin = require("./WebpackShellPlugin")

var config = require("./webpack.base.config.js")

config.entry = {
    background: ['./chrome-extension/background.js'],
    contentScript: ['./chrome-extension/contentScript.js'],
    from: ['./src/from.js'],
    injected: ["./chrome-extension/injected.js"]
};
config.output = {
    path: "./",
    filename: 'chrome-extension/dist/[name].js'
};

config.plugins.push(new WebpackShellPlugin({
    onBuildEnd: [
        "cp chrome-extension/manifest.json chrome-extension/dist/manifest.json",
        "node build-from-js-for-extension.js"
    ]
}))

module.exports = config;

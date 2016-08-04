var webpack = require('webpack');
var WebpackShellPlugin = require("./WebpackShellPlugin")

var config = require("./webpack.base.config.js")

config.entry = {
    background: ['./chrome-extension/background.js'],
    contentScript: ['./chrome-extension/contentScript.js'],
    from: ['./src/from.js']
};
config.output = {
    path: "./",
    filename: 'chrome-extension/dist/[name].js'
};

config.plugins.push(new WebpackShellPlugin({
    onBuildEnd: [
        "cp chrome-extension/manifest.json chrome-extension/dist/manifest.json",
        "cp fromjs.css chrome-extension/dist/fromjs.css"
    ]
}))

module.exports = config;

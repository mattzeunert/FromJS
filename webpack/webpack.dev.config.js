var webpack = require('webpack');
var WebpackShellPlugin = require("./WebpackShellPlugin")
var getBaseConfig = require("./getBaseConfig")

var webConfig = getBaseConfig()
webConfig.entry = {
    background: ['./chrome-extension/background.js'],
    contentScript: ['./chrome-extension/contentScript.js'],
    from: ['./src/from.js'],
    injected: ["./chrome-extension/injected.js"]
};
webConfig.output = {
    path: "./",
    filename: 'chrome-extension/dist/[name].js'
};
webConfig.plugins.push(new WebpackShellPlugin({
    onBuildEnd: [
        "cp chrome-extension/manifest.json chrome-extension/dist/manifest.json",
        "cp chrome-extension/dist/from.js dist/from.js",
        "cp chrome-extension/dist/from.js.map dist/from.js.map",
    ]
}))

var serverConfig = getBaseConfig()
serverConfig.entry = {
    server: ['./server.js']
};
serverConfig.output = {
    path: "./",
    filename: './dist/[name].js'
};
serverConfig.target = "node"
serverConfig.node.__dirname = false
serverConfig.node.__filename = false

module.exports = [webConfig, serverConfig]

var webpack = require('webpack');
var WebpackShellPlugin = require("webpack-shell-plugin")
var getBaseConfig = require("./getBaseConfig")

var webConfig = getBaseConfig()
webConfig.entry = {
    background: ['./code-preprocessing-test/background.js'],
    ChromeCodeInstrumenter: ["./chrome-extension/ChromeCodeInstrumenter.js"]
};
webConfig.output = {
    path: "./",
    filename: 'code-preprocessing-test/dist/[name].js'
};
webConfig.plugins.push(new WebpackShellPlugin({
    onBuildExit: [
        `
        cp chrome-extension/dist/resolveFrameWorker.js code-preprocessing-test/dist/resolveFrameWorker.js
        cp chrome-extension/dist/injected.js code-preprocessing-test/dist/injected.js
        cp chrome-extension/dist/inhibitJavaScriptExecution.js code-preprocessing-test/dist/inhibitJavaScriptExecution.js
        cp code-preprocessing-test/manifest.json code-preprocessing-test/dist/manifest.json;
        echo 'Finished onBuildExit';
        `
    ]
})
)

module.exports = [webConfig]

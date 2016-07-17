var config = require("../webpack.config.js")
var webpack = require("webpack")

var definePlugin = new webpack.DefinePlugin({
    'process.env': {
        'NODE_ENV': '"production"',
        'isDemo': 'true'
    }
});

config.plugins.push(definePlugin);

module.exports = config

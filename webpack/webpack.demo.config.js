// This doesn't really work anymore, but I don't think I really need
// to update the pre-rendered Backbone TodoMVC demo.

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

var configs = require("./webpack.dev.config")
var webpack = require("webpack")

var definePlugin = new webpack.DefinePlugin({
    'process.env': {
        'NODE_ENV': '"production"'
    }
});

configs.forEach(function(config){
    config.plugins.push(definePlugin);
});

module.exports = configs

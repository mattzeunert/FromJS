/*
    I don't think I need this file! Running npm run build should be enough
*/


var config = require("./getBaseConfig")()
var webpack = require("webpack")

config.entry = {
    main: ['./src/from.js']
};
config.output = {
    path: "./",
    filename: 'dist/from.js'
};

var definePlugin = new webpack.DefinePlugin({
    'process.env': {
        'NODE_ENV': '"production"',
    }
});

config.plugins.push(definePlugin);

module.exports = config

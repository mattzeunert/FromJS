var webpack = require('webpack');

var modules = {
    loaders:[
        {
            test: /\.js$/,
            loader: "babel-loader",
            exclude: /node_modules/
        },
        {
            test: /\.json$/,
            loader: "json"
        }
    ]
}
var node = {
    fs: 'empty',
    module: 'empty',
    net: 'empty'
}

module.exports = [{
    entry: {
        main: ['./st/string-trace.js']
    },
    output: {
        path: "./",
        filename: 'dist/from.js'
    },
    devtool: "source-map",
    module: module,
    node: node
},
{
    entry: {
        main: ['./vis/vis.js']
    },
    output: {
        path: "./",
        filename: 'dist/vis.js'
    },
    devtool: "source-map",
    module: module,
    node: node
}]

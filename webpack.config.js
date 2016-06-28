var webpack = require('webpack');

module.exports = {
    entry: {
        main: ['./st/string-trace.js']
    },
    output: {
        path: "./",
        filename: 'dist/from.js'
    },
    devtool: "source-map",
    module: {
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
    },
    node: {
        fs: 'empty',
        module: 'empty',
        net: 'empty'
    }
};

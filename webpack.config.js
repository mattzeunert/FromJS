var webpack = require('webpack');

var config = require("./webpack/webpack.base.config.js")

config.entry = {
    main: ['./src/from.js']
};
config.output = {
    path: "./",
    filename: 'dist/from.js'
};

module.exports = config;

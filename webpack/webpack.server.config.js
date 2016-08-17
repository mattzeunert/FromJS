var webpack = require('webpack');

var config = require("./webpack.base.config.js")

config.entry = {
    server: ['./server.js']
};
config.output = {
    path: "./",
    filename: './dist/[name].js'
};
config.target = "node"
config.node.__dirname = false
config.node.__filename = false

console.log(config)

module.exports = config;

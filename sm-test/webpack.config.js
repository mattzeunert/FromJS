module.exports = {
    devtool: "source-map",
    entry: "./sm-test/sm-test.js",
    output: {
        path: "./sm-test/",
        filename: "sm-test-compiled.js"
    },
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
            },
            {
                test: /\.css$/,
                loader: "css-loader"
            }
        ]
    },
    node: {
        fs: 'empty',
        module: 'empty',
        net: 'empty'
    },
    plugins: []
}

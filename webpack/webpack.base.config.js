var config = {
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

module.exports = config

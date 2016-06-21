var webpack = require('webpack');


module.exports = {
  entry: {
    main: ['./st/string-trace.js']
  },
  output: {
    path: "./",
    filename: 'backbone-todomvc/dontprocess/string-trace.js'
},
devtool: "source-map",
module: {
    loaders:[
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

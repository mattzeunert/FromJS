var webpack = require('webpack');

module.exports = {
  entry: {
    main: ['./compile.js']
  },
  output: {
    path: "./",
    filename: 'backbone-todomvc/dontprocess/compile-built.js'
},
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

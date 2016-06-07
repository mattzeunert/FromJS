var webpack = require('webpack');

module.exports = {
  entry: {
    main: ['./compile.js']
  },
  output: {
    path: "./",
    filename: 'compile-built.js'
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

'use strict'

const webpack = require('webpack')
const path = require('path')

const babel = {
  "plugins": [
    "syntax-async-functions",
    "transform-async-to-generator",
    "syntax-flow",
    "transform-flow-strip-types"
  ].map((p) => require.resolve('babel-plugin-' + p)),
  "presets": ["es2015", "stage-0", "stage-3", "react"].map((p) => require.resolve('babel-preset-' + p))
}

module.exports = {
  output: {
    publicPath: '/assets/',
    path: 'dist/assets/',
    filename: 'app.js'
  },
  entry: './src/components/App.js',
  devtool: 'sourcemap',
  node: {
    console: false,
    process: 'mock',
    Buffer: true
  },
  stats: {
    colors: true,
    reasons: false
  },
  plugins: [
    new webpack.optimize.AggressiveMergingPlugin(),
    // new webpack.optimize.UglifyJsPlugin({
    //   mangle: false,
    // }),
    new webpack.NoErrorsPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': '"production"'
      }
    })
  ],
  resolve: {
    alias: {
      'node_modules': path.join(__dirname + '/node_modules'),
      'http': path.join(__dirname + '/node_modules', 'stream-http'),
      // 'https': path.join(__dirname + '/node_modules', 'https-browserify'),
      'fs': path.join(__dirname + '/node_modules', 'html5-fs'),
      'app': __dirname + '/src/app/',
      'styles': __dirname + '/src/styles',
      'mixins': __dirname + '/src/mixins',
      'components': __dirname + '/src/components/',
      'stores': __dirname + '/src/stores/',
      'actions': __dirname + '/src/actions/',
      'lib': __dirname + '/src/lib/',
      'utils': __dirname + '/src/utils/'
    }
  },
  module: {
    loaders: [{
      test: /\.(js|jsx)$/,
      exclude: /node_modules/,
      loader: 'babel',
      query: babel
    }, {
      test: /\.js$/,
      include: /node_modules\/(hoek|qs|wreck|boom|ipfs.+|orbit.+|logplease|crdts|promisify-es|whatwg-fetch|node-fetch|isomorphic-fetch|db\.js)/,
      loader: 'babel',
      query: babel
    }, {
      test: /\.css$/,
      loader: 'style-loader!css-loader'
    }, {
      test: /\.scss/,
      loader: 'style-loader!css-loader!sass-loader?outputStyle=expanded'
    }, {
      test: /\.(png|jpg|woff|woff2)$/,
      loader: 'url-loader?limit=8192'
    }, {
      test: /\.(png|jpg)$/,
      loader: 'file?name=[path][name].[ext]',
    }, {
      test: /\.json$/,
      loader: 'json'
    }]
  },
  externals: {
    fs: '{}',
    du: '{}',
    net: '{}',
    tls: '{}',
    console: '{}',
    'require-dir': '{}',
    mkdirp: '{}'
  }
}

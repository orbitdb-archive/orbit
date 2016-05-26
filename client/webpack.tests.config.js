'use strict';

const webpack = require('webpack');
const path = require('path');

const babel = {
  "plugins": [
    "transform-regenerator",
    "syntax-async-functions",
    "syntax-async-generators",
    "transform-async-to-generator",
    "syntax-flow",
    "transform-flow-strip-types"
  ].map((p) => require.resolve('babel-plugin-' + p)),
  "presets": ["es2015", "stage-0", "stage-3", "react"].map((p) => require.resolve('babel-preset-' + p))
}

module.exports = {
  output: {
    filename: 'bundle.js',
    path: __dirname
  },
  cache: false,
  debug: true,
  devtool: 'sourcemap',
  entry: [
    require.resolve('babel-polyfill'),
    './test/tests.bundle.js'
  ],
  node: {
    console: false,
    process: 'mock',
    Buffer: true
  },
  stats: {
    colors: true,
    reasons: true
  },
  resolveLoader: {
    modules: [
      'node_modules',
      path.join(__dirname, 'node_modules')
    ],
  },
  resolve: {
    // extensions: ['', '.js', '.jsx'],
    modules: [
      'node_modules',
      path.join(__dirname, 'node_modules')
    ],
    alias: {
      // fs: require.resolve('./src/fs-mock'),
      'node_modules': path.join(__dirname + '/node_modules'),
      'app': __dirname + '/src/app/',
      'styles': __dirname + '/src/styles',
      'mixins': __dirname + '/src/mixins',
      'components': __dirname + '/src/components/',
      'stores': __dirname + '/src/stores/',
      'actions': __dirname + '/src/actions/',
      'utils': __dirname + '/src/utils/'
    }
  },
  module: {
    // preLoaders: [{
    //   test: /\.(js|jsx)$/,
    //   exclude: /node_modules/,
    //   loader: 'eslint-loader'
    // }],
    loaders: [{
      test: /\.(js|jsx)$/,
      exclude: /node_modules/,
      loader: 'babel',
      query: babel
    }, {
      test: /\.js$/,
      include: /node_modules\/(hoek|qs|wreck|boom|ipfs-.+|logplease|orbit|crdts)/,
      loader: 'babel',
      query: babel
    }, {
      test: /\.scss/,
      loader: 'style-loader!css-loader!sass-loader?outputStyle=expanded'
    }, {
      test: /\.css$/,
      loader: 'style-loader!css-loader'
    }, {
      test: /\.(png|jpg|woff|woff2)$/,
      loader: 'url-loader?limit=8192'
    }, {
      test: /\.json$/,
      loader: 'json'
    }],
    postLoaders: [{
      test: /\.js$/,
      loader: 'transform?brfs'
    }]
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin()
  ],
  externals: {
    net: '{}',
    tls: '{}',
    fs: '{}',
    'require-dir': '{}',
    mkdirp: '{}'
  }
};

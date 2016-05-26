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
    filename: 'tests.bundle.js',
    path: 'test/'
  },
  cache: false,
  debug: true,
  devtool: 'sourcemap',
  entry: [
    './test/orbit.test.js'
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
    root: path.join(__dirname, 'node_modules')
  },
  resolve: {
    modulesDirectories: [
      path.join(__dirname, 'node_modules')
    ],
    alias: {
      fs: require.resolve('./src/fs-mock'),
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
    loaders: [{
      test: /\.(js|jsx)$/,
      exclude: /node_modules/,
      loader: 'babel'
    }, {
      test: /\.js$/,
      include: /node_modules\/(hoek|qs|wreck|boom)/,
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
    }]
  },
  externals: {
    net: '{}',
    tls: '{}',
    'require-dir': '{}',
    mkdirp: '{}'
  }
};

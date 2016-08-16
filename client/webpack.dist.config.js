'use strict';

const webpack = require('webpack');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

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
    filename: '[name].js'
  },
  entry: {
    app: './src/components/App.js',
    vendor: [
      // 'ipfs',
      'react', 'react-dom', 'react-router', 'react-addons-css-transition-group',
      'reflux',
      'lodash', 'logplease', 'fs',
      'react-dropzone', 'react-autolink',
      'highlight.js', 'clipboard', 'pleasejs', 'halogen',
      'web3', 'uport-lib'
    ],
    emojis: [
      'react-emoji', 'emoji-annotation-to-unicode', './src/components/EmojiPicker.js'
    ]
  },
  debug: false,
  devtool: false,
  node: {
    console: false,
    process: 'mock',
    Buffer: 'buffer'
  },
  stats: {
    colors: true,
    reasons: false
  },
  plugins: [
    new CopyWebpackPlugin([
      { from: path.join(__dirname + '/node_modules', 'ipfs/dist/index.min.js'), to: 'ipfs.js' }
    ]),
    new webpack.optimize.CommonsChunkPlugin({ name: "emojis", filename: "emojis.js", chunks: ['emojis'], children: true }),
    new webpack.optimize.CommonsChunkPlugin({ name: "vendor", filename: "vendor.js", chunks: ['vendor'], children: true }),
    new webpack.optimize.AggressiveMergingPlugin(),
    new webpack.optimize.UglifyJsPlugin(),
    new webpack.NoErrorsPlugin()
  ],
  resolveLoader: {
    root: path.join(__dirname, 'node_modules')
  },
  resolve: {
    modulesDirectories: [
      path.join(__dirname, 'node_modules')
    ],
    alias: {
      'node_modules': path.join(__dirname + '/node_modules'),
      'fs': path.join(__dirname + '/node_modules', 'html5-fs'),
      'node-webcrypto-ossl': path.join(__dirname + '/node_modules', 'webcrypto'),
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
      loader: 'babel',
      query: babel
    }, {
      test: /\.js$/,
      include: /node_modules\/(hoek|qs|wreck|boom|logplease|ipfs-.+|orbit.*|crdts)/,
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
      test: /\.json$/,
      loader: 'json'
    }]
  },
  externals: {
    du: '{}',
    net: '{}',
    tls: '{}',
    console: '{}',
    'require-dir': '{}',
    mkdirp: '{}'
  }
};

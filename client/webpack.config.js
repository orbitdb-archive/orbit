'use strict';

const webpack = require('webpack');
const path = require('path');

module.exports = {
  output: {
    filename: 'main.js',
    publicPath: '/assets/'
  },
  entry: {
    app: [
      'webpack/hot/only-dev-server',
      './src/components/App.js'
    ],
    vendor: [
      'react', 'react-dom', 'react-router', 'react-addons-css-transition-group',
      'lodash', 'logplease', 'fs',
      'react-dropzone', 'react-emoji', 'react-autolink', 'emoji-annotation-to-unicode',
      'highlight.js', 'clipboard', 'pleasejs', 'halogen'
    ]
  },
  cache: false,
  debug: true,
  devtool: 'sourcemap',
  node: {
    console: false,
    process: 'mock',
    Buffer: 'buffer'
  },
  stats: {
    colors: true,
    reasons: true
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({ name: "vendor", filename: "vendor.js" }),
    new webpack.HotModuleReplacementPlugin()
  ],
  resolveLoader: {
    root: path.join(__dirname, 'node_modules')
  },
  resolve: {
    // extensions: ['', '.js', '.jsx'],
    modulesDirectories: [
      'node_modules',
      path.join(__dirname, 'node_modules')
    ],
    alias: {
      'node_modules': path.join(__dirname + '/node_modules'),
      'libp2p-ipfs': 'libp2p-ipfs-browser',
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
    }, {
      test: /\.js$/,
      include: /node_modules\/(hoek|qs|wreck|boom)/,
      loader: 'babel',
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
    du: '{}',
    net: '{}',
    tls: '{}',
    'require-dir': '{}',
    mkdirp: '{}'
  }
};

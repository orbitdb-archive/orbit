'use strict';

const webpack = require('webpack');
const path = require('path');

module.exports = {
  output: {
    filename: 'main.js',
    publicPath: '/assets/'
  },
  cache: false,
  debug: true,
  devtool: 'sourcemap',
  entry: [
    'webpack/hot/only-dev-server',
    './src/components/App.js'
  ],
  node: {
    console: false,
    process: 'mock',
    Buffer: 'buffer'
  },
  stats: {
    colors: true,
    reasons: true
  },
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
      // "node-forge": require.resolve("peer-id/vendor/forge.bundle.js"),
      "libp2p-ipfs": "libp2p-ipfs-browser",
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
    // preLoaders: [{
    //   test: /\.(js|jsx)$/,
    //   exclude: /node_modules/,
    //   loader: 'eslint-loader'
    // }],
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
  plugins: [
    new webpack.HotModuleReplacementPlugin()
  ],
  externals: {
    net: '{}',
    tls: '{}',
    'require-dir': '{}',
    mkdirp: '{}'
  }
};

'use strict';

const webpack = require('webpack');
const path = require('path');
const ChunkManifestPlugin = require('chunk-manifest-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  output: {
    filename: '[name].js',
    publicPath: '/assets/'
  },
  entry: {
    app: [
      'webpack/hot/only-dev-server',
      './src/components/App.js'
    ],
    vendor: [
      // 'ipfs',
      'react', 'react-dom', 'react-router', 'react-addons-css-transition-group',
      'reflux',
      'lodash', 'logplease', 'fs', 'html5-fs',
      'react-dropzone', 'react-autolink',
      'highlight.js', 'clipboard', 'pleasejs', 'halogen',
      // 'web3', 'uport-lib', 'uport-persona', 'uport-registry'
    ],
    emojis: [
      'react-emoji', 'emoji-annotation-to-unicode', './src/components/EmojiPicker.js'
    ]
    // ipfs: [
    //   // './src/main.js'
    //   // // 'ipfs'
    //   path.join(__dirname + '/node_modules', 'ipfs/dist/index.js')
    // ]
  },
  plugins: [
    new CopyWebpackPlugin([
      { from: path.join(__dirname + '/node_modules', 'ipfs/dist/index.js'), to: 'ipfs.js' }
    ]),
    new ChunkManifestPlugin({
      filename: "manifest.json",
      manifestVariable: "webpackManifest"
    }),
    // new webpack.optimize.CommonsChunkPlugin({ name: "ipfs", filename: "ipfs.js", chunks: ['ipfs'] }),
    new webpack.optimize.CommonsChunkPlugin({ name: "emojis", filename: "emojis.js", chunks: ['emojis'] }),
    new webpack.optimize.CommonsChunkPlugin({ name: "vendor", filename: "vendor.js", chunks: ['vendor'] }),
    new webpack.optimize.AggressiveMergingPlugin(),
    new webpack.HotModuleReplacementPlugin()
  ],
  cache: false,
  debug: true,
  devtool: 'sourcemap',
  devServer: {
    headers: { "Access-Control-Allow-Origin": "*" }
  },
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
      'node_modules': path.join(__dirname + '/node_modules'),
      // 'ipfs': path.join(__dirname + '/node_modules', 'ipfs/dist/index.js'),
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
      test: /\.(png|jpg)$/,
      loader: 'file?name=[path][name].[ext]',
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

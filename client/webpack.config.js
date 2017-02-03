'use strict'

const webpack = require('webpack')
const path = require('path')
const ChunkManifestPlugin = require('chunk-manifest-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

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
  },
  plugins: [
    new ChunkManifestPlugin({
      filename: "manifest.json",
      manifestVariable: "webpackManifest"
    }),
    new webpack.HotModuleReplacementPlugin()
  ],
  cache: false,
  devtool: 'sourcemap',
  devServer: {
    headers: { "Access-Control-Allow-Origin": "*" }
  },
  node: {
    console: false,
    process: 'mock',
    Buffer: true
  },
  stats: {
    colors: true,
    reasons: true
  },
  resolve: {
    alias: {
      'node_modules': path.join(__dirname + '/node_modules'),
      'libp2p-ipfs': 'libp2p-ipfs-browser',
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
      loader: 'babel-loader',
    }, {
      test: /\.js$/,
      include: /node_modules\/(hoek|qs|wreck|boom)/,
      loader: 'babel-loader',
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
      loader: 'json-loader'
    }]
  },
  externals: {
    fs: '{}',
    du: '{}',
    net: '{}',
    tls: '{}',
    'require-dir': '{}',
    mkdirp: '{}'
  }
}

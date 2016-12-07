'use strict'

const webpack = require('webpack')
const path = require('path')

const babel = {
  "plugins": [
    "syntax-async-functions",
    "transform-async-to-generator",
    "syntax-flow",
    "transform-flow-strip-types",
    "transform-regenerator",
  ].map((p) => require.resolve('babel-plugin-' + p)),
  "presets": ["es2015", "stage-0", "stage-3", "react"].map((p) => require.resolve('babel-preset-' + p))
}

module.exports = {
  output: {
    publicPath: '/assets/',
    path: 'dist/assets/',
    filename: 'app.js'
  },
  // Need to include babel-polyfill (otherwise error: regenerator something something)
  // don't add to package.json, comes with ipfs, so it's already in node_modules
  entry: ['babel-polyfill', './src/components/App.js'],
  devtool: 'sourcemap',
  node: {
    console: false,
    process: 'mock',
    Buffer: true
  },
  target: 'web',
  stats: {
    colors: true,
    reasons: false
  },
  plugins: [
    new webpack.optimize.AggressiveMergingPlugin(),
    // new webpack.optimize.UglifyJsPlugin({
    //   mangle: false,
    //   compress: { warnings: false }
    // }),
    new webpack.NoErrorsPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': '"production"'
      }
    })
  ],
  resolve: {
    modules: [
      "node_modules",
      // path.join(__dirname, '../node_modules'),
      // path.join(__dirname, '../..//node_modules')
    ],
    alias: {
      'node_modules': path.join(__dirname + '/node_modules'),
      zlib: 'browserify-zlib',
      http: 'stream-http',
      https: 'https-browserify',
      Buffer: 'buffer',
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
  // resolveLoader: {
  //   modules: [
  //     'node_modules',
  //     path.resolve(__dirname, '../node_modules')
  //   ],
  //   moduleExtensions: ['-loader']
  // },
  module: {
    loaders: [
    {
      test: /\.(js|jsx)$/,
      exclude: /node_modules/,
      loader: 'babel-loader',
      query: babel
    }, 
    {
      test: /\.js$/,
      // include: /node_modules\/(ipfs-post|orbit.+|logplease|crdts)/,
      include: /node_modules\/(hoek|qs|wreck|boom|promisify-es|logplease|ipfs.+|orbit.+|crdts|peer-.+|ipld.+|cbor|multi.+|mux|libp2p.+)/,
      // include: /node_modules\/(hoek|qs|wreck|boom|ipfs-.+|orbit-.+|logplease|crdts|promisify-es6)/,
      loader: 'babel-loader',
      query: babel
    }, 
    {
      test: /\.css$/,
      loader: 'style-loader!css-loader'
    }, 
    {
      test: /\.scss/,
      loader: 'style-loader!css-loader!sass-loader?outputStyle=expanded'
    }, 
    {
      test: /\.(png|jpg|woff|woff2)$/,
      loader: 'url-loader?limit=8192'
    }, 
    {
      test: /\.(png|jpg)$/,
      loader: 'file-loader?name=[path][name].[ext]',
    }, 
    {
      test: /\.json$/,
      loader: 'json-loader'
    }
    ]
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

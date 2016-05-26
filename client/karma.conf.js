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
};

const webpackConf = require('./webpack.dist.config.js');

module.exports = function(config) {
  config.set({
    singleRun: false,

    frameworks: ['mocha'],

    browsers: ['Chrome'],

    reporters: ['dots'],

    files: [
      // './node_modules/phantomjs-polyfill/bind-polyfill.js',
      'test/tests.bundle.js',
      // 'test/tests.js'
    ],

    preprocessors: {
      './test/tests.bundle.js': ['webpack']
      // 'test/*.js': ['webpack']
    },

    webpack: require('./webpack.tests.config.js'),
    // webpack: {
    //   // output: {
    //   //   publicPath: '/test/',
    //   //   path: 'test/assets/',
    //   //   filename: 'tests.js'
    //   // },
    //   entry: [
    //     'test/orbit.test.js'
    //   ],
    //   // stats: {
    //   //   colors: true,
    //   //   reasons: true
    //   // },
    //   node: {
    //     console: false,
    //     process: 'mock',
    //     Buffer: 'buffer'
    //   },
    //   // resolveLoader: {
    //   //   root: path.join(__dirname, 'node_modules')
    //   // },
    //   cache: false,
    //   // debug: true,
    //   // devtool: 'sourcemap',
    //   module: webpackConf.module,
    //   resolve: webpackConf.resolve,
    //   resolveLoader: webpackConf.resolveLoader,
    //   externals: webpackConf.externals,
    //   // resolve: {
    //   //   // extensions: ['', '.js', '.jsx'],
    //   //   modulesDirectories: [
    //   //     'node_modules',
    //   //     path.join(__dirname, 'node_modules')
    //   //   ],
    //   //   alias: {
    //   //     fs: require.resolve('./src/fs-mock'),
    //   //     'node_modules': path.join(__dirname + '/node_modules'),
    //   //     'app': __dirname + '/src/app/',
    //   //     'styles': __dirname + '/src/styles',
    //   //     'mixins': __dirname + '/src/mixins',
    //   //     'components': __dirname + '/src/components/',
    //   //     'stores': __dirname + '/src/stores/',
    //   //     'actions': __dirname + '/src/actions/',
    //   //     'utils': __dirname + '/src/utils/'
    //   //   }
    //   // },
    //   // module: {
    //   //   loaders: [{
    //   //     test: /\.(js|jsx)$/,
    //   //     exclude: /node_modules/,
    //   //     loader: 'babel',
    //   //     query: babel
    //   //   }, {
    //   //     test: /\.js$/,
    //   //     include: /node_modules\/(hoek|qs|wreck|boom|ipfs-.+|logplease|orbit|crdts)/,
    //   //     // include: /node_modules\/(hoek|qs|wreck|boom)/,
    //   //     loader: 'babel',
    //   //     query: babel
    //   //   }, {
    //   //     test: /\.scss/,
    //   //     loader: 'style-loader!css-loader!sass-loader?outputStyle=expanded'
    //   //   }, {
    //   //     test: /\.css$/,
    //   //     loader: 'style-loader!css-loader'
    //   //   }, {
    //   //     test: /\.(png|jpg|woff|woff2)$/,
    //   //     loader: 'url-loader?limit=8192'
    //   //   }, {
    //   //     test: /\.json$/,
    //   //     loader: 'json'
    //   //   }]
    //   // }
    // },

    // webpack: {
    //   // webpack configuration
    //   // resolveLoader: {
    //   //   root: path.join(__dirname, 'node_modules')
    //   // },
    //   module: {
    //     loaders: [{
    //       test: /\.(js|jsx)$/,
    //       exclude: /node_modules/,
    //       loader: 'babel',
    //       query: babel
    //     }, {
    //       test: /\.js$/,
    //       include: /node_modules\/(hoek|qs|wreck|boom)/,
    //       loader: 'babel',
    //       query: babel
    //     }, {
    //       test: /\.scss/,
    //       loader: 'style-loader!css-loader!sass-loader?outputStyle=expanded'
    //     }, {
    //       test: /\.css$/,
    //       loader: 'style-loader!css-loader'
    //     }, {
    //       test: /\.(png|jpg|woff|woff2)$/,
    //       loader: 'url-loader?limit=8192'
    //     }, {
    //       test: /\.json$/,
    //       loader: 'json'
    //     }]
    //   }
    //   // resolve: {
    //   //   modulesDirectories: [
    //   //     'node_modules',
    //   //     path.join(__dirname, 'node_modules')
    //   //   ],
    //   //   alias: {
    //   //     fs: require.resolve('./src/fs-mock'),
    //   //     'node_modules': path.join(__dirname + '/node_modules'),
    //   //     'app': __dirname + '/src/app/',
    //   //     'styles': __dirname + '/src/styles',
    //   //     'mixins': __dirname + '/src/mixins',
    //   //     'components': __dirname + '/src/components/',
    //   //     'stores': __dirname + '/src/stores/',
    //   //     'actions': __dirname + '/src/actions/',
    //   //     'utils': __dirname + '/src/utils/'
    //   //   }
    //   // }
    //   // externals: {
    //   //   net: '{}',
    //   //   tls: '{}',
    //   //   'require-dir': '{}',
    //   //   mkdirp: '{}'
    //   // },
    // },

    webpackMiddleware: {
      // webpack-dev-middleware configuration
      noInfo: true
    }

  });
};

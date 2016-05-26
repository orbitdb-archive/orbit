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

    reporters: ['mocha'],

    files: [
      'test/orbit.test.js',
    ],

    preprocessors: {
      './test/orbit.test.js': ['webpack']
    },

    webpack: require('./webpack.tests.config.js'),

    webpackMiddleware: {
      // noInfo: true
    }

  });
};

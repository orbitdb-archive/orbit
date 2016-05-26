'use strict';

const webpack = require('webpack');
const path = require('path');

const webpackConf = require('./webpack.dist.config.js');

module.exports = function(config) {
  config.set({
    singleRun: false,

    frameworks: ['mocha'],

    browsers: ['Chrome'],

    reporters: ['mocha'],

    browserNoActivityTimeout: 100000,

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

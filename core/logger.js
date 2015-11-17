var path   = require('path');
var log4js = require('log4js');
var logger = log4js.getLogger();
var utils  = require('./utils');

log4js.configure({
  appenders: [
    { type: 'console' },
    { type: 'file', filename: path.resolve(utils.getAppPath(), 'debug.log') }
  ]
});

module.exports = logger;
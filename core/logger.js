var path   = require('path');
var log4js = require('log4js');
var logger = log4js.getLogger();

log4js.configure({
  appenders: [
    { type: 'console' },
    { type: 'file', filename: path.resolve(process.type ? process.resourcesPath + "/app/" : process.cwd(), 'debug.log') }
  ]
});

module.exports = logger;
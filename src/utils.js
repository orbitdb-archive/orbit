'use strict';

var fs      = require('fs');
var async   = require('asyncawait/async');
var await   = require('asyncawait/await');
var Promise = require('bluebird');
var du      = require('du');

exports.getFileSize = async ((filePath) => {
  var size    = 0;
  var stat    = Promise.promisify(fs.stat);
  var dirSize = Promise.promisify(du);
  var result = await (stat(filePath));

  if(result.isDirectory())
    size = await (dirSize(filePath));
  else
    size = result.size;

  return size;
});

exports.isDirectory = async ((filePath) => {
  if(!fs.existsSync(filePath))
    return false;

  var stat = Promise.promisify(fs.stat);
  var file = await (stat(filePath));
  return file.isDirectory();
});

exports.getUserHome = () => {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

exports.getAppPath = () => {
  return process.type && process.env.ENV !== "dev" ? process.resourcesPath + "/app/" : process.cwd();
}
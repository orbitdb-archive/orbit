'use strict';

var fs      = require('fs');
var du      = require('du');
var Promise = require('bluebird');

exports.getUserHome = () => {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

exports.getAppPath = () => {
  return process.type && process.env.ENV !== "dev" ? process.resourcesPath + "/app/" : process.cwd();
}

/* File utils */

const stat = Promise.promisify(fs.stat);
const getDirSize = Promise.promisify(du);

exports.getFileSize = (filePath) => {
  return new Promise((resolve, reject) => {
    const result = fs.statSync(filePath);
    if(result.isDirectory())
      getDirSize(filePath).then(resolve);
    else
      resolve(result.size);
  });
};

exports.isDirectory = (filePath) => {
  if(!fs.existsSync(filePath))
    return false;
  const file = fs.statSync(filePath)
  return file.isDirectory();
};

const deleteDirectoryRecursive = (path) => {
  if(fs.existsSync(path)) {
    fs.readdirSync(path).forEach((file, index) => {
      const curPath = path + '/' + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteDirectoryRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};
exports.deleteDirectoryRecursive = deleteDirectoryRecursive;

'use strict';

var fs      = require('fs');
var du      = require('du');

exports.getUserHome = () => {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

exports.getAppPath = () => {
  return process.type && process.env.ENV !== "dev" ? process.resourcesPath + "/app/" : process.cwd();
}

/* File utils */
exports.getFileSize = (filePath) => {
  return new Promise((resolve, reject) => {
    const result = fs.statSync(filePath);
    if(result.isDirectory())
      du(filePath, (err, res) => resolve());
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

exports.ipfsDaemon = (IPFS, addr) => {
  const ipfs = new IPFS('/tmp/orbit');
  return (new Promise((resolve, reject) => {
    ipfs.init({}, (err) => {
      if (err) {
        if (err.message === 'repo already exists') {
          return resolve();
        }
        return reject(err);
      }
      resolve();
    })
  }))
    .then(() => new Promise((resolve, reject) => {
      console.log('showing config')
      ipfs.config.show((err, config) => {
        if (err) return reject(err);
        resolve(config);
      });
    }))
    .then((config) => new Promise((resolve, reject) => {
      config.Addresses.Swarm.push(addr)
      console.log('trying to replace config')
      ipfs.config.replace(config, (err) => {
        console.log('replaced config', err)
        if (err) return reject(err);
        resolve();
      });
    }))
    .then(() => new Promise((resolve, reject) => {
      ipfs.goOnline(() => {
        console.log('going online')
        resolve();
      });
    }))
    .then(() => {
      return ipfs;
    });
};

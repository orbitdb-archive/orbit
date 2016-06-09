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

exports.ipfsDaemon = (IPFS, repo, signalServerAddress) => {
  // console.log("2", repo, signalServerAddress);
  repo = repo || '/tmp/orbit';
  console.log("Signalling server: " + signalServerAddress);
  signalServerAddress = signalServerAddress || '0.0.0.0';
  console.log("IPFS Path: " + repo);
  const ipfs = new IPFS(repo);
  return new Promise((resolve, reject) => {
    ipfs.init({}, (err) => {
      if (err) {
        if (err.message === 'repo already exists') {
          console.log(repo, err.message)
          return resolve();
        }
        return reject(err);
      }
      resolve();
    })
  })
  .then(() => {
    return new Promise((resolve, reject) => {
      ipfs.goOnline(() => {
        resolve(ipfs);
      });
    });
  })
  .then((id) => {
    return new Promise((resolve, reject) => {
      ipfs.config.show((err, config) => {
        if (err) return reject(err);
        // console.log("config1", JSON.stringify(config))
        resolve(config);
      });
    });
  })
  .then(() => {
    return new Promise((resolve, reject) => {
      ipfs.id((err, id) => {
        // console.log(err, id)
        if (err) return reject(err);
        resolve(id);
      });
    });
  })
  .then((id) => new Promise((resolve, reject) => {
    ipfs.config.show((err, config) => {
      if (err) return reject(err);
      // console.log(">>>>", addr + `/ipfs/${id.ID}`);
      // const signallingServer = '/libp2p-webrtc-star/ip4/178.62.241.75/tcp/9090/ws'
      const signallingServer = `/libp2p-webrtc-star/ip4/${signalServerAddress}/tcp/9090/ws`; // localhost
      // config.Addresses.Swarm = [`${addr}/ipfs/${id.ID}`, `${signallingServer}/ipfs/${id.ID}`];
      config.Addresses.Swarm = [`${signallingServer}/ipfs/${id.ID}`];
      ipfs.config.replace(config, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }))
  .then(() => {
    return new Promise((resolve, reject) => {
      ipfs.goOffline(resolve);
    });
  })
  .then(() => {
    return new Promise((resolve, reject) => {
      ipfs.goOnline(() => {
        resolve(ipfs);
      });
    });
  })
  .then(() => {
    return new Promise((resolve, reject) => {
      ipfs.id((err, id) => {
        // console.log(err, id)
        if (err) return reject(err);
        resolve(id);
      });
    });
  })
  .then((id) => {
    return new Promise((resolve, reject) => {
      ipfs.config.show((err, config) => {
        if (err) return reject(err);
        // console.log("config2", JSON.stringify(config))
        resolve(config);
      });
    });
  })
  .then(() => {
    return ipfs;
  })
}

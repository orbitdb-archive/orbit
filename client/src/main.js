'use strict';

const fs           = require('fs');
const path         = require('path');
const EventEmitter = require('events').EventEmitter;
const Logger       = require('logplease');
const logger       = Logger.create("Orbit.Main", { color: Logger.Colors.Yellow });
const Orbit        = require('../../src/Orbit');
// const IPFS         = require('exports?Ipfs!ipfs/dist/index.js')
// const IPFS = require('ipfs')

var ENV = process.env["ENV"] || "release";
logger.debug("Running in '" + ENV + "' mode");
// process.env.PATH += ":/usr/local/bin" // fix for Electron app release bug (PATH doesn't get carried over)

const getAppPath = () => process.type && process.env.ENV !== "dev" ? process.resourcesPath + "/app/" : process.cwd()

// Create data directory
const dataPath = path.join(getAppPath(), "/data");
// if(!fs.existsSync(dataPath))
//   fs.mkdirSync(dataPath);

/* MAIN */
const events = new EventEmitter();
let ipfs, orbit, peerId;

const start = exports.start = (ipfsApiInstance, repositoryPath, signalServerAddress) => {
  // if(!id) id = 0;//new Date().getTime();
  if(ipfsApiInstance) {
    // const i = new window.IpfsApi();
    // const i = new IPFAPI();
    orbit = new Orbit(ipfsApiInstance, { dataPath: dataPath });
    return ipfsApiInstance.id()
      .then((id) => {
        console.log(id);
        return { orbit: orbit, peerId: id };
      });
  } else {
    return Promise.resolve({ orbit: null, peerId: null })
    // const startTime = new Date().getTime();
    // logger.info("Starting IPFS...");
    // return utils.jsIpfsDaemon(window.Ipfs, repositoryPath, signalServerAddress)
    //   .then((res) => {
    //     ipfs = res;
    //     orbit = new Orbit(ipfs, { dataPath: dataPath });
    //   })
    //   .then(() => {
    //     return new Promise((resolve, reject) => {
    //       ipfs.id((err, id) => {
    //         if (err) return reject(err);
    //         resolve(id);
    //       });
    //     });
    //   })
    //   .then((res) => {
    //     peerId = res;
    //     // logger.info(`IPFS Node started: ${id.Addresses}/ipfs/${id.ID}`);
    //     // console.log();
    //     // console.log(`Orbit-${id} ^^^^^^^`);
    //     // console.log(peerId.Addresses[0]);
    //     // console.log();
    //     return;
    //   })
    //   .then(() => {
    //     const endTime = new Date().getTime();
    //     logger.debug('Startup time: ' + (endTime - startTime) + "ms");
    //     return { orbit: orbit, peerId: peerId };
    //   })
  }
};

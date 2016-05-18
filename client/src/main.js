'use strict';

const fs           = require('fs');
const path         = require('path');
const EventEmitter = require('events').EventEmitter;
const Logger       = require('logplease');
const logger       = Logger.create("Orbit.Main", { color: Logger.Colors.Yellow });
// const ipfsd        = require('ipfsd-ctl');
// const SocketApi    = require('../../src/api/SocketApi');
// const HttpApi      = require('./api/HttpApi');
const utils        = require('../../src/utils');
const Orbit        = require('../../src/Orbit');
// const IPFS         = require('ipfs');
const IPFS = require('exports?Ipfs!ipfs/dist/index.js')

var ENV = process.env["ENV"] || "release";
logger.debug("Running in '" + ENV + "' mode");
// process.env.PATH += ":/usr/local/bin" // fix for Electron app release bug (PATH doesn't get carried over)

// Create data directory
const dataPath = path.join(utils.getAppPath(), "/data");
// if(!fs.existsSync(dataPath))
//   fs.mkdirSync(dataPath);

/* MAIN */
const events = new EventEmitter();
let ipfs, orbit;

const start = exports.start = () => {
  const startTime = new Date().getTime();

  const ipfsDaemon = () => {
    logger.info("Starting IPFS...");
    return new Promise((resolve, reject) => {
      const ipfs = new IPFS();
      ipfs.goOnline(() => {
        resolve(ipfs)
      })
      // ipfsd.local((err, node) => {
      //   if(err) reject(err);
      //   if(node.initialized) {
      //     node.startDaemon((err, ipfs) => {
      //       if(err) reject(err);
      //       resolve(ipfs);
      //     });
      //   } else {
      //     node.init((err, res) => {
      //       if(err) reject(err);
      //       node.startDaemon((err, ipfs) => {
      //         if(err) reject(err);
      //         resolve(ipfs);
      //       });
      //     });
      //   }
      // });
    });
  };

  return ipfsDaemon()
    .then((res) => {
      ipfs = res;
      orbit = new Orbit(ipfs, events, { dataPath: dataPath });
      return;
    })
    // .then(() => HttpApi(ipfs, events))
    // .then((httpApi) => SocketApi(httpApi.socketServer, httpApi.server, events, orbit))
    // .then(() => SocketApi(null, null, events, orbit))
    .then(() => {
      events.on('socket.connected', (s) => orbit.onSocketConnected(s));
      events.on('shutdown', () => orbit.disconnect()); // From index-native (electron)
      return;
    })
    .then(() => {
      // auto-login if there's a user.json file
      // var userFile = path.join(path.resolve(utils.getAppPath(), "user.json"));
      // if(fs.existsSync(userFile)) {
      //   const user = JSON.parse(fs.readFileSync(userFile));
      //   logger.debug(`Using credentials from '${userFile}'`);
      //   logger.debug(`Registering as '${user.username}'`);
      //   const network = 'QmRB8x6aErtKTFHDNRiViixSKYwW1DbfcvJHaZy1hnRzLM';
      //   return orbit.connect(network, user.username, user.password);
      // }
      return;
    })
    .then(() => {
      const endTime = new Date().getTime();
      logger.debug('Startup time: ' + (endTime - startTime) + "ms");
      return orbit;
    })
};

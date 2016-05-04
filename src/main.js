'use strict';

const fs           = require('fs');
const path         = require('path');
const EventEmitter = require('events').EventEmitter;
const ipfsDaemon   = require('orbit-common/lib/ipfs-daemon');
const logger       = require('logplease').create("Orbit.Main");
const SocketApi    = require('./api/SocketApi');
const HttpApi      = require('./api/HttpApi');
const Network      = require('./NetworkConfig');
const Orbit        = require('./Orbit');

var ENV = process.env["ENV"] || "release";
logger.debug("Running in '" + ENV + "' mode");
process.env.PATH += ":/usr/local/bin" // fix for Electron app release bug (PATH doesn't get carried over)

const getAppPath = () => {
  return process.type && process.env.ENV !== "dev" ? process.resourcesPath + "/app/" : process.cwd();
}

/* MAIN */
const events = new EventEmitter();
let ipfsd, orbit;

const start = exports.start = () => {
  const startTime = new Date().getTime();

  logger.info("Starting IPFS...");

  return ipfsDaemon()
    .then((res) => {
      ipfsd = res;
      orbit = new Orbit(ipfsd.ipfs, events);
    })
    .then(() => HttpApi(ipfsd.ipfs, events))
    .then((httpApi) => SocketApi(httpApi.socketServer, httpApi.server, events, orbit))
    .then(() => {
      events.on('socket.connected', (s) => orbit.onSocketConnected(s));
      events.on('shutdown', () => orbit.disconnect()); // From index-native (electron)
      return;
    })
    .then(() => {
      // auto-login if there's a user.json file
      var userFile = path.join(path.resolve(getAppPath(), "user.json"));
      if(fs.existsSync(userFile)) {
        const user = JSON.parse(fs.readFileSync(userFile));
        logger.debug(`Using credentials from '${userFile}'`);
        logger.debug(`Registering as '${user.username}'`);
        const network = 'QmRB8x6aErtKTFHDNRiViixSKYwW1DbfcvJHaZy1hnRzLM';
        return orbit.connect(network, user.username, user.password);
      }
      return;
    })
    .then(() => {
      const endTime = new Date().getTime();
      logger.debug('Startup time: ' + (endTime - startTime) + "ms");
      return events;
    })
    .catch((e) => {
      logger.error(e.message);
      logger.error("Stack trace:\n", e.stack);
    });
};

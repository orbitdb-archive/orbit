'use strict';

const fs           = require('fs');
const path         = require('path');
const EventEmitter = require('events').EventEmitter;
const async        = require('asyncawait/async');
const await        = require('asyncawait/await');
const ipfsDaemon   = require('orbit-common/lib/ipfs-daemon');
const logger       = require('logplease').create("Orbit.Main");
const utils        = require('orbit-common/lib/utils');
const SocketApi    = require('./api/SocketApi');
const HttpApi      = require('./api/HttpApi');
const Network      = require('./NetworkConfig');
const Orbit        = require('./Orbit');

var ENV = process.env["ENV"] || "release";
logger.debug("Running in '" + ENV + "' mode");
process.env.PATH += ":/usr/local/bin" // fix for Electron app release bug (PATH doesn't get carried over)

/* MAIN */
const events = new EventEmitter();
const start = exports.start = async(() => {
  try {
    const startTime = new Date().getTime();

    // Start ipfs daemon
    logger.info("Starting IPFS...");
    const ipfsd = await(ipfsDaemon());

    // Start Orbit
    const orbit = new Orbit(ipfsd.ipfs, events);

    // Start the APIs
    var httpApi   = await (HttpApi(ipfsd.ipfs, events));
    var socketApi = await (SocketApi(httpApi.socketServer, httpApi.server, events, orbit));

    events.on('socket.connected', (s) => orbit.onSocketConnected(s));
    events.on('shutdown', () => orbit.disconnect()); // From index-native (electron)

    // auto-login if there's a user.json file
    var userFile = path.join(path.resolve(utils.getAppPath(), "user.json"));
    if(fs.existsSync(userFile)) {
      var user = JSON.parse(fs.readFileSync(userFile));
      logger.debug(`Using credentials from '${userFile}'`);
      logger.debug(`Registering as '${user.username}'`);
      var network = Network.fromFile(path.resolve(utils.getAppPath(), "network.json"));
      await(orbit.connect(network.host + ":" + network.port, user.username, user.password));
    }

    const endTime = new Date().getTime();
    logger.debug('Startup time: ' + (endTime - startTime) + "ms");

    return events;

  } catch(e) {
    logger.error(e.message);
    logger.error("Stack trace:\n", e.stack);
  }
});

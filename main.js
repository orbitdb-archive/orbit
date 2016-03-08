'use strict';

var _              = require('lodash');
var assert         = require('assert');
var fs             = require('fs');
var path           = require('path');
var EventEmitter   = require('events').EventEmitter;
var timer          = require('metrics-timer');
var Promise        = require('bluebird');
var async          = require('asyncawait/async');
var await          = require('asyncawait/await');
var utils          = require('./core/utils');
var logger         = require('./core/logger');
var SocketApi      = require('./core/api/SocketApi');
var HttpApi        = require('./core/api/HttpApi');
var Network        = require('./core/Network');

const OrbitNetwork = require('./src/OrbitNetwork');
const ipfsDaemon   = require('orbit-common/lib/ipfs-daemon');

Promise.longStackTraces(); // enable regular stack traces in catch

var ENV = process.env["ENV"] || "release";
logger.debug("Running in '" + ENV + "' mode");
process.env.PATH += ":/usr/local/bin" // fix for Electron app release bug (PATH doesn't get carried over)

let ipfs, orbit;
var _handleError = (e) => {
  logger.error(e.message);
  logger.debug("Stack trace:\n", e.stack);
  events.emit('orbit.error', e.message);
};

var _handleMessage = (channel, message) => {
  events.emit('message', channel, message);
};

var handler = {
  onSocketConnected: async((socket) => {
    events.emit('network', orbit);
  }),
  connect: async((host, username, password) => {
    const hostname = host.split(":")[0];
    const port = host.split(":")[1];
    // const network = { host: hostname, port: port };
    // TODO: hard coded until UI is fixed
    var network = Network.fromConfig(path.resolve(utils.getAppPath(), "network.json"));
    const user = { username: username, password: password };
    try {
      logger.info(`Connecting to network at '${network.host}:${network.port}' as '${user.username}`);
      orbit = await(OrbitNetwork.connect(network.host, network.port, user.username, user.password, false, ipfs));
      orbit.events.on('message', _handleMessage);
      logger.info(`Connected to '${orbit.network.name}' at '${orbit.network.host}:${orbit.network.port}' as '${user.username}`)
      events.emit('network', orbit);
    } catch(e) {
      _handleError(e);
    }
  }),
  disconnect: async(() => {
    const host = orbit.network.host;
    const port = orbit.network.port;
    const name = orbit.network.name;
    orbit.events.removeListener('message', _handleMessage);
    orbit.disconnect();
    logger.warn(`Disconnected from '${name}' at '${host}:${port}'`);
  }),
  getChannels: async((callback) => {
    if(orbit && callback) callback(orbit.channels);
  }),
  join: async((channel, password, callback) => {
    logger.debug(`Join #${channel}`);
    orbit.joinChannel(channel, password)
    events.emit('channels.updated', orbit.channels);
    if(callback) callback(null, { name: channel, modes: {} })
  }),
  getUser: async((userHash, callback) => {
    if(callback) callback(userHash);
  }),
  getMessages: async((channel, lessThanHash, greaterThanHash, amount, callback) => {
    logger.debug(`Get messages from #${channel}: ${lessThanHash}, ${greaterThanHash}, ${amount}`)
    let options = { limit: amount };
    if(lessThanHash) options.lt = lessThanHash;
    if(greaterThanHash) options.gt = greaterThanHash;
    const messages = await(orbit.getMessages(channel, options));
    if(callback) callback(channel, messages);
  }),
  sendMessage: async((channel, message, callback) => {
    try {
      logger.info(`Send message to #${channel}: ${message}`);
      const r = orbit.publish(channel, message);
      if(callback) callback(null);
    } catch(e) {
      _handleError(e);
      if(callback) callback(e.message);
    }
  })
};

/* MAIN */
// var ipfs;
const events = new EventEmitter();
const start = exports.start = async(() => {
  try {
    var startupTime = "Startup time";
    timer.start(startupTime);

    // events.on('onRegister', connectToNetwork);
    // events.on('disconnect', stopApplication);

    // Start ipfs daemon
    const ipfsd = await(ipfsDaemon());
    ipfs = ipfsd.ipfs;
    // daemon = ipfsd.daemon;

    var httpApi   = await (HttpApi(events));
    var socketApi = await (SocketApi(httpApi.socketServer, httpApi.server, events, handler));

    events.on('socket.connected', handler.onSocketConnected);

    // auto-login if there's a user.json file
    var userFile = path.join(__dirname, "user.json");
    if(fs.existsSync(userFile)) {
      var user = JSON.parse(fs.readFileSync(userFile));
      logger.debug(`Using credentials from '${userFile}'`);
      logger.debug(`Registering as '${user.username}'`);
      var network = Network.fromConfig(path.resolve(utils.getAppPath(), "network.json"));
      await(handler.connect(network.host + ":" + network.port, user.username, user.password));
    }

    logger.debug('Startup time: ' + timer.stop(startupTime) + "ms");

    return events;

  } catch(e) {
    logger.error(e.message);
    logger.error("Stack trace:\n", e.stack);
  }
});

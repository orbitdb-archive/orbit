'use strict';

const fs           = require('fs');
const path         = require('path');
const EventEmitter = require('events').EventEmitter;
const Promise      = require('bluebird');
const async        = require('asyncawait/async');
const await        = require('asyncawait/await');
const logger       = require('orbit-common/lib/logger');
const ipfsDaemon   = require('orbit-common/lib/ipfs-daemon');
const ipfsAPI      = require('orbit-common/lib/ipfs-api-promised');
const Post         = require('orbit-db/src/post/Post');
const SocketApi    = require('./api/SocketApi');
const HttpApi      = require('./api/HttpApi');
const OrbitNetwork = require('./OrbitNetwork');
const Network      = require('./Network');
const utils        = require('./utils');

Promise.longStackTraces(); // enable regular stack traces in catch

var ENV = process.env["ENV"] || "release";
logger.debug("Running in '" + ENV + "' mode");
process.env.PATH += ":/usr/local/bin" // fix for Electron app release bug (PATH doesn't get carried over)

/* HANDLER - TODO: move to its own file */
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
      orbit = null;
      _handleError(e);
    }
  }),
  disconnect: async(() => {
    if(orbit) {
      const host = orbit.network.host;
      const port = orbit.network.port;
      const name = orbit.network.name;
      orbit.events.removeListener('message', _handleMessage);
      orbit.disconnect();
      orbit = null;
      logger.warn(`Disconnected from '${name}' at '${host}:${port}'`);
      events.emit('network', null);
    }
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
  leave: async((channel) => {
    orbit.leaveChannel(channel);
    events.emit('channels.updated', orbit.channels);
    logger.debug("Left channel #" + channel);
  }),
  getUser: async((userHash, callback) => {
    // TODO: return user id from ipfs hash (user.id)
    if(callback) callback(orbit.user.id);
  }),
  getMessages: async((channel, lessThanHash, greaterThanHash, amount, callback) => {
    // logger.debug(`Get messages from #${channel}: ${lessThanHash}, ${greaterThanHash}, ${amount}`)
    let options = { limit: amount };
    if(lessThanHash) options.lt = lessThanHash;
    if(greaterThanHash) options.gt = greaterThanHash;
    const messages = await(orbit.getMessages(channel, options));
    if(callback) callback(channel, messages);
  }),
  sendMessage: async((channel, message, callback) => {
    try {
      logger.debug(`Send message to #${channel}: ${message}`);
      const r = orbit.publish(channel, message);
      if(callback) callback(null);
    } catch(e) {
      _handleError(e);
      if(callback) callback(e.message);
    }
  }),
  addFile:  async((channel, filePath, callback) => {
    const addToIpfs = async((ipfs, filePath) => {
      if(!fs.existsSync(filePath))
        throw "File not found at '" + filePath + "'";

      var hash = await (ipfsAPI.add(ipfs, filePath));

      // FIXME: ipfs-api returns an empty dir name as the last hash, ignore this
      if(hash[hash.length-1].Name === '')
        return hash[hash.length-2].Hash;

      return hash[hash.length-1].Hash;
    });

    logger.info("Adding file from path '" + filePath + "'");
    var isDirectory = await (utils.isDirectory(filePath));
    var hash = await (addToIpfs(ipfs, filePath));
    var size = await (utils.getFileSize(filePath));
    logger.info("Added local file '" + filePath + "' as " + hash);

    const data = {
      name: filePath.split("/").pop(),
      hash: hash,
      size: size
    };

    const type = isDirectory ? Post.Types.Directory : Post.Types.File;
    const post = await(Post.create(ipfs, type, data));

    orbit.publish(channel, post);

    if(callback) callback(null);
  }),
  getDirectory: async((hash, callback) => {
    try {
      const result = await(ipfsAPI.ls(ipfs, hash));
      if(result.Objects && callback)
        callback(result.Objects[0].Links);
    } catch(e) {
      _handleError(e);
      if(callback) callback(null);
    }
  })
};

/* MAIN */
const events = new EventEmitter();
const start = exports.start = async(() => {
  try {
    const startTime = new Date().getTime();

    logger.info("Starting IPFS...");
    // Start ipfs daemon
    const ipfsd = await(ipfsDaemon());
    ipfs = ipfsd.ipfs;

    // Start the APIs
    var httpApi   = await (HttpApi(ipfs, events));
    var socketApi = await (SocketApi(httpApi.socketServer, httpApi.server, events, handler));

    events.on('socket.connected', handler.onSocketConnected);

    // From index-native (electron)
    events.on('shutdown', ()=> {
      handler.disconnect();
    });

    // auto-login if there's a user.json file
    var userFile = path.join(path.resolve(utils.getAppPath(), "user.json"));
    if(fs.existsSync(userFile)) {
      var user = JSON.parse(fs.readFileSync(userFile));
      logger.debug(`Using credentials from '${userFile}'`);
      logger.debug(`Registering as '${user.username}'`);
      var network = Network.fromConfig(path.resolve(utils.getAppPath(), "network.json"));
      await(handler.connect(network.host + ":" + network.port, user.username, user.password));
    }

    const endTime = new Date().getTime();
    logger.debug('Startup time: ' + (endTime - startTime) + "ms");

    return events;

  } catch(e) {
    logger.error(e.message);
    logger.error("Stack trace:\n", e.stack);
  }
});

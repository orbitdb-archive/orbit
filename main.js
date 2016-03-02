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
// var ipfsd          = require('./core/ipfs-daemon');
// var networkAPI     = require('./core/network-api');
var utils          = require('./core/utils');
var logger         = require('./core/logger');
var SocketApi      = require('./core/api/SocketApi');
var HttpApi        = require('./core/api/HttpApi');
var Network        = require('./core/Network');

const OrbitNetwork = require('./src/OrbitNetwork');

Promise.longStackTraces(); // enable regular stack traces in catch

var ENV = process.env["ENV"] || "release";
logger.debug("Running in '" + ENV + "' mode");
process.env.PATH += ":/usr/local/bin" // fix for Electron app release bug (PATH doesn't get carried over)

/* CONFIG */
// var config      = {};
// config.ipfsPath = path.resolve(utils.getUserHome() + '/.ipfs');

/* PROGRAM */
// var connect = async((config, network, username, password) => {
//   var user = { id: null, username: null };

//   // Connect to the network server
//   var network;//
//   try {
//     network = await (networkAPI.register(network.address, username, password));
//   } catch(e) {
//     throw e;
//   }

//   var peers     = network.config.Bootstrap;
//   user.id       = network.user.id;
//   user.username = network.user.username;

//   // Start ipfs daemon
//   var ipfsNode = await (ipfsd.init(config.ipfsPath, { SupernodeRouting: network.config.SupernodeRouting }));
//   if(!ipfsNode) {
//     throw "IPFS daemon already running! Please make sure ipfs daemon is not running.";
//     return null;
//   }

//   var daemon = await (ipfsd.start(ipfsNode));

//   // Connect to server-returned peers
//   networkAPI.connectToSwarm(daemon.instance, user, peers);

//   return { network: network.name, ipfs: daemon.instance, user: user };
// });

// move to BotSystem module
// var _bots = [];
// var startBots = (ipfs, user) => {
//   if(_.includes(process.argv, "--bots")) {
//     var botsDirectory = path.join(__dirname, "bots/");
//     logger.debug("Starting bots from '" + botsDirectory + "'")
//     var botFiles = fs.readdirSync(botsDirectory);
//     botFiles.forEach((file) => {
//       var Bot = require(path.join(botsDirectory, file));
//       var bot = new Bot(ipfs, networkAPI.events, user);
//       bot.init();
//       _bots.push(bot);
//     });
//   } else {
//     logger.warn("Not starting bots. If you want to run the bots, provide '--bots' argument.");
//   }
// };

// var connectToNetwork = async((network, user) => {
// // var startApplication = async((network, username, password, callback) => {
//   // // TODO: pickup network address from the input param instead of networkConfig file
//   // try {
//   //   var startupTime = "Startup time";
//   //   timer.start(startupTime);
//   //   logger.debug("Start program");

//   //   var network = Network.fromConfig(path.resolve(utils.getAppPath(), "network.json"));
//   //   var res     = await(connect(config, network, username, password));
//   //   events.emit('login', res.user);
//   //   startBots(res.ipfs, res.user);
//   //   events.emit('onIpfsStarted', res);
//   //   if(callback) callback(null, res);
//   //   logger.debug('Startup time: ' + timer.stop(startupTime) + "ms");
//   //   _bots.forEach((bot) => bot.start());
//   // } catch(e) {
//   //   logger.error(e);
//   //   if(callback) callback(e, null);
//   // }
//   logger.info(`Connecting to Orbit network at '${network.host}:${network.port}' as '${user.username}`);
//   const orbit = OrbitNetwork.connect(network.host, network.port, user.username, user.password);
//   logger.info(`Connected to Orbit network at '${network.host}:${network.port}' as '${user.username}`)
//   return orbit;
// });

var stopApplication = () => {
  // ipfsd.stop();
  // TODO: disconnec tfrom OrbitDB
};

var handler = {
  connect: async((host, username, password) => {
    const hostname = host.split(":")[0];
    const port = host.split(":")[1];
    // const network = { host: hostname, port: port };
    const user = { username: username, password: password };
    let orbit;
    // TODO: hard coded until UI is fixe
    var network = Network.fromConfig(path.resolve(utils.getAppPath(), "network.json"));
    try {
      logger.info(`Connecting to Orbit network at '${network.host}:${network.port}' as '${user.username}`);
      orbit = OrbitNetwork.connect(network.host, network.port, user.username, user.password);
      logger.info(`Connected to Orbit network at '${network.host}:${network.port}' as '${user.username}`)
      events.emit('connected', orbit);
    } catch(e) {
      logger.error(e.message);
      logger.error("Stack trace:\n", e.stack);
      events.emit('orbit.error', e);
    }
    return orbit;
  })
};

/* MAIN */
// var ipfs;
var events = new EventEmitter();
var start = exports.start = async(() => {
  try {
    var startupTime = "Startup time";
    timer.start(startupTime);

    // events.on('onRegister', connectToNetwork);
    events.on('disconnect', stopApplication);

    var httpApi   = await (HttpApi(events));
    var socketApi = await (SocketApi(httpApi.socketServer, httpApi.server, events, handler));

    var network = Network.fromConfig(path.resolve(utils.getAppPath(), "network.json"));

    // auto-login if there's a user.json file
    var userFile = path.join(__dirname, "user.json");
    if(fs.existsSync(userFile)) {
      var user = JSON.parse(fs.readFileSync(userFile));
      logger.debug(`Using credentials from '${userFile}'`);
      logger.debug(`Registering as '${user.username}'`);
      handler.connect(network.host + ":" + network.port, user.username, user.password);
    }

    logger.debug('Startup time: ' + timer.stop(startupTime) + "ms");

    return events;

  } catch(e) {
    logger.error(e.message);
    logger.error("Stack trace:\n", e.stack);
  }
});

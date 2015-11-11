'use strict';

var _              = require('lodash');
var fs             = require('fs');
var path           = require('path');
var EventEmitter   = require('events').EventEmitter;
var timer          = require('metrics-timer');
var Promise        = require('bluebird');
var async          = require('asyncawait/async');
var await          = require('asyncawait/await');
var ipfsd          = require('./core/ipfs-daemon');
var networkAPI     = require('./core/network-api');
var utils          = require('./core/utils');
var logger         = require('./core/logger');
var SocketApi      = require('./core/api/SocketApi');
var HttpApi        = require('./core/api/HttpApi');
var Network        = require('./core/Network');

Promise.longStackTraces(); // enable regular stack traces in catch

var ENV = process.env["ENV"] || "release";
logger.debug("Running in '" + ENV + "' mode");
process.env.PATH += ":/usr/local/bin" // fix for Electron app release bug (PATH doesn't get carried over)

/* CONFIG */
var config      = {};
config.ipfsPath = path.resolve(utils.getUserHome() + '/.ipfs');

/* PROGRAM */
var connect = async((config, network, username, password) => {
  var user = { id: null, username: null };

  // Connect to the network server
  var network   = await (networkAPI.register(network.address, username, password));
  var peers     = network.addrs.Bootstrap;
  user.id       = network.uid;
  user.username = username;

  // Start ipfs daemon
  var ipfsNode    = await (ipfsd.init(config.ipfsPath, { SupernodeRouting: network.addrs.SupernodeRouting }));

  if(!ipfsNode) {
    throw "IPFS daemon already running! Please make sure ipfs daemon is not running.";
    return null;
  }

  var daemon = await (ipfsd.start(ipfsNode));

  // Connect to server-returned peers
  await (networkAPI.connectToSwarm(daemon.instance, user, peers));

  return { ipfs: daemon.instance, user: user };
});

// move to BotSystem module
var _bots = [];
var startBots = (ipfs, user) => {
  if(_.includes(process.argv, "--bots")) {
    var botsDirectory = path.join(__dirname, "bots/");
    logger.debug("Starting bots from '" + botsDirectory + "'")
    var botFiles = fs.readdirSync(botsDirectory);
    botFiles.forEach((file) => {
      var Bot = require(path.join(botsDirectory, file));
      var bot = new Bot(ipfs, networkAPI.events, user);
      bot.init();
      _bots.push(bot);
    });
  } else {
    logger.warn("Not starting bots. If you want to run the bots, provide '--bots' argument.");
  }
};

var startApplication = (network, username, password, callback) => {
  // TODO: pickup network address from the input param instead of networkConfig file
  try {
    var startupTime = "Startup time";
    timer.start(startupTime);
    logger.debug("Start program");

    var network = Network.fromConfig(path.resolve(__dirname, "network.json"));
    var res     = await(connect(config, network, username, password));
    startBots(res.ipfs, res.user);
    events.emit('onIpfsStarted', res);
    if(callback) callback(null, res);
    logger.debug('Startup time: ' + timer.stop(startupTime) + "ms");
    _bots.forEach((bot) => bot.start());
  } catch(e) {
    logger.error(e);
    if(callback) callback(e, null);
  }
};

var stopApplication = () => {
  ipfsd.stop();
};

process.on('uncaughtException', (err) => {
  logger.error("Uncaught Exception:");
  logger.error(JSON.stringify(err, null, 2));
});


/* MAIN */
var events = new EventEmitter();
var start = exports.start = async(() => {
  events.on('onRegister', startApplication);
  events.on('disconnect', stopApplication);

  var httpApi   = await (HttpApi(events));
  var socketApi = await (SocketApi(httpApi.socketServer, httpApi.server, events));

  // auto-login if there's a user.json file
  var userFile = path.join(__dirname, "user.json");
  if(fs.existsSync(userFile)) {
    var user = JSON.parse(fs.readFileSync(userFile));
    startApplication("empty for now", user.username, user.password);
  }

  return events;
});

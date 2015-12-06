'use strict';

var _           = require('lodash');
var Base58      = require('bs58');
var crypto      = require('crypto');
var async       = require('asyncawait/async');
var await       = require('asyncawait/await');
var socketIo    = require('socket.io');

var logger      = require('../logger');
var networkAPI  = require('../network-api');
var ipfsAPI     = require('../ipfs-api-promised');
var ApiMessages = require('../ApiMessages');
var Channel     = require('../Channel')
var channelHash = Channel.createChannelHash

/* SOCKET API */
var SocketApi = async ((socketServer, httpServer, events) => {
  logger.debug("Starting socket server");

  var io = socketIo(socketServer);
  socketServer.listen(httpServer);

  var socket       = null;
  var ipfs         = null;
  var userInfo     = {};
  var networkInfo  = {};

  var onIpfsStarted = (res) => {
    logger.debug("SocketApi ready");
    userInfo = res.user;
    ipfs     = res.ipfs;
  };

  var onLogin = (user) => {
    if(socket) socket.emit("login", user);
  };

  var onNewMessages = (channel, data) => {
    if(socket) socket.emit("messages", channel, data);
  };

  var onMessage = (channelName, message) => {
    events.emit('message', channelName, message);
  };

  var unsubscribe = (socket, msg) => {
    if(typeof msg === "string")
      socket.removeAllListeners(msg);
    else if(typeof msg === "object")
      Object.keys(msg).forEach((v) => unsubscribe(socket, msg[v]));
  };

  var cleanupSocket = async (function() {
    await (networkAPI.leaveAllChannels());
    networkAPI.events.removeAllListeners("messages");
    if(socket) {
      Object.keys(ApiMessages).forEach((v) => unsubscribe(socket, ApiMessages[v]));
      socket = null;
    }
  });

  events.removeListener("login", onLogin);
  events.removeListener("onIpfsStarted", onIpfsStarted);
  events.on('onIpfsStarted', onIpfsStarted);
  events.on("login", onLogin);

  io.on('connection', async (function (s) {
    logger.info("UI connected");
    await (cleanupSocket());

    if(!socket) {
      socket = s;

    networkAPI.events.on("messages", onNewMessages);
    // networkAPI.events.on("message", onMessage);

    socket.on(ApiMessages.error, function(err) {
      logger.error("Caught flash policy server socket error: ")
      logger.error(err.stack)
    });

    socket.on(ApiMessages.disconnect, async (function () {
      await (cleanupSocket());
      logger.warn("UI diconnected");
    }));

    var channelPasswordMap = {};
    var channelWritePasswordMap = {};

    socket.on(ApiMessages.channel.join, async ((channel, password, callback) => {
      if(ipfs) {
        logger.debug("Join #" + channel + (password ? " (with password)" : ""));
        networkAPI.joinChannel(ipfs, channel, userInfo.id, password)
          .then((channelInfo) => {
            logger.debug("Joined #" + channel);
            channelPasswordMap[channel] = password;
            channelInfo.name = channel;
            callback(null, channelInfo);
          })
          .catch((err) => {
            logger.error("Can't join #" + channel + ":", err);
            callback(err, null);
          });
        } else {
          callback("Not initialized!", null);
        }
    }));

    socket.on(ApiMessages.channel.part, async (function (channelName) {
      logger.debug("Leave channel #" + channelName);
      delete channelPasswordMap[channelName];
      await (networkAPI.leaveChannel(channelHash(channelName)));
    }));

    socket.on(ApiMessages.channel.messages, async (function(channelName, startHash, lastHash, amount, cb) {
      var password = channelPasswordMap[channelName];
      networkAPI.getMessages(ipfs, channelHash(channelName), userInfo.id, password, startHash, lastHash, amount)
        .then((messages) => cb(channelName, messages))
        .catch(function(err) {
          logger.error("Error in channel.get", err);
          cb(null);
        });
    }));

    socket.on(ApiMessages.message.send, async((channelName, message, cb) => {
      var rpwd    = channelPasswordMap[channelName];
      var wpwd    = channelWritePasswordMap[channelName];
      networkAPI.sendMessage(ipfs, message, channelName, userInfo.id, rpwd, wpwd)
        .then((result) => cb(null))
        .catch((err) => {
          logger.error("Couldn't send message:", err)
          cb(err)
        });
    }));

    socket.on(ApiMessages.file.add, async((channelName, filePath, cb) => {
      var rpwd    = channelPasswordMap[channelName];
      var wpwd    = channelWritePasswordMap[channelName];
      networkAPI.addFile(ipfs, filePath, channelName, userInfo.id, rpwd, wpwd)
        .then((result) => cb(null))
        .catch((err) => cb(err));
    }));

    socket.on(ApiMessages.channel.setMode, async((channel, modes, cb) => {
      var password = channelPasswordMap[channel];
      networkAPI.setChannelMode(ipfs, channel, userInfo.id, password, modes)
        .then(async ((newMode) => {
          logger.debug("Channel mode set to:", newMode);
          channelPasswordMap[channel] = newMode.modes.r ? newMode.modes.r.password : '';

          if(password !== channelPasswordMap[channel]) {
            var message = newMode.modes.r ? "/me set channel password to '" + channelPasswordMap[channel] + "'" : "/me removed channel password";
            await(networkAPI.sendMessage(ipfs, message, channel, userInfo.id, channelPasswordMap[channel], null));
          }

          if(_(modes).pluck('mode').find((m) => { return  m === '+w' })) {
            var message = "/me is now moderating the channel";
            await(networkAPI.sendMessage(ipfs, message, channel, userInfo.id, channelPasswordMap[channel], null));
          }

          if(_(modes).pluck('mode').find((m) => { return  m === '-w' })) {
            var message = "/me disabled channel moderation mode";
            await(networkAPI.sendMessage(ipfs, message, channel, userInfo.id, channelPasswordMap[channel], null));
          }

          cb(null, newMode);
        }))
        .catch((err) => {
          logger.error("Couldn't set channel mode:", err);
          cb(err, null);
        });
    }));

    socket.on(ApiMessages.message.get, async ((hash, cb) => {
      networkAPI.getObject(ipfs, hash)
        .then(cb)
        .catch((err) => {
          logger.error("Error in message.get", err);
          cb(null);
        });
    }));

    //TODO: get rid of simpleCache and replace with SQLite3 cache (like messages). simpleCache is heavy on memory.
    //TODO: call via networkAPI, not directly ipfsAPI
    var simpleCache = {};
    socket.on(ApiMessages.list.get, async (function(hash, cb) {
      if(!simpleCache[hash]) {
        ipfsAPI.ls(ipfs, hash)
          .then(function(result) {
            if(result.Objects) {
              simpleCache[hash] = result.Objects[0].Links;
              cb(result.Objects[0].Links);
            }
          })
          .catch(function(err) {
            logger.error("Error in list.get", err);
            cb(null);
          });
      } else {
        cb(simpleCache[hash]);
      }
    }));

    socket.on(ApiMessages.user.get, async (function (hash, cb) {
      networkAPI.getUser(ipfs, hash)
      .then(cb)
      .catch(function(err) {
        // we end up here if the user doesn't exists. ipfs error: { Message: 'invalid ipfs ref path', Code: 0 }
        cb(null);
      });
    }));

    socket.on(ApiMessages.whoami, async (function (cb) {
      var res = Object.assign(userInfo, { network: networkInfo });
      if(cb) cb(res);
    }));

    socket.on(ApiMessages.swarm.peers, async((cb) => {
      ipfsAPI.swarmPeers(ipfs)
        .then((peers) => cb(peers.Strings))
        .catch((err) => {
          logger.warn("swarm.get", err);
          cb([]);
        });
    }));

    socket.on(ApiMessages.deregister, async (function () {
      logger.warn("SHUTDOWN!");
      await (networkAPI.leaveAllChannels());
      ipfs = null;
      userInfo = {};
      networkInfo = {};
      events.emit('disconnect');
    }));

    socket.on(ApiMessages.register, async (function (host, username, password) {
      events.emit('onRegister', host, username, password, (err, res) => {
        if(!err) {
          networkInfo.host = host;
          networkInfo.name = res.network;
          socket.emit('registered', { name: networkInfo.name, host: networkInfo.host, user: userInfo });
          events.emit('connect');
        } else {
          socket.emit('log', "register error: " + err);
          socket.emit('register.error', JSON.stringify(err.toString()));
        }
      });
    }));

    }
  }));
})

module.exports = SocketApi;

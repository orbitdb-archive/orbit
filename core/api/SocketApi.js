'use strict';

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

  var onNewMessages = (data) => {
    if(socket) socket.emit("messages", data);
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
    // networkAPI.events.removeAllListeners("message");
    if(socket) {
      Object.keys(ApiMessages).forEach((v) => unsubscribe(socket, ApiMessages[v]));
      socket = null;
    }
  });

  io.on('connection', async (function (s) {
    logger.info("UI connected");
    await (cleanupSocket());
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

    socket.on(ApiMessages.channel.join, async ((channelName, password, callback) => {
      if(ipfs) {
        logger.debug("Join channel:", channelName);
        var channel = new Channel(channelName, password);
        networkAPI.joinChannel(ipfs, channel.hash, userInfo.id, password)
          .then((channelInfo) => {
            logger.debug("Joined channel #" + channelName);
            channelPasswordMap[channelName] = password;
            channelWritePasswordMap[channelName] = channelInfo.writePassword;
            callback(null, channelInfo);
          })
          .catch((err) => {
            logger.error("Can't join channel #" + channelName + ":", err);
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
      if(channelPasswordMap[channelName] !== undefined) {
        var password = channelPasswordMap[channelName];
        networkAPI.getMessages(ipfs, channelHash(channelName), userInfo.id, password, startHash, lastHash, amount)
          .then(cb)
          .catch(function(err) {
            logger.error("Error in channel.get", err);
            cb(null);
          });
      } else {
        logger.debug("Leave channel #" + channelName);
        delete channelPasswordMap[channelName];
        await (networkAPI.leaveChannel(channelHash(channelName)));
        logger.error("Not allowed to read #" + channelName);
        cb("Not allowed to read #");
      }
    }));

    socket.on(ApiMessages.message.send, async((channelName, message, cb) => {
      var channel = channelHash(channelName);
      var rpwd    = channelPasswordMap[channelName];
      var wpwd    = channelWritePasswordMap[channelName];
      networkAPI.sendMessage(ipfs, message, channel, userInfo.id, rpwd, wpwd)
        .then((result) => cb(null))
        .catch((err) => {
          logger.error("Couldn't send message:", err)
          cb(err)
        });
    }));

    socket.on(ApiMessages.file.add, async((channelName, filePath, cb) => {
      var channel = channelHash(channelName);
      var rpwd    = channelPasswordMap[channelName];
      var wpwd    = channelWritePasswordMap[channelName];
      networkAPI.addFile(ipfs, filePath, channel, userInfo.id, rpwd, wpwd)
        .then((result) => cb(null))
        .catch((err) => cb(err));
    }));

    socket.on(ApiMessages.channel.passwords, async((channelName, newReadPassword, newWritePassword, cb) => {
      var channel  = channelHash(channelName);
      var password = channelWritePasswordMap[channelName];
      networkAPI.changeChannelPasswords(ipfs, channel, userInfo.id, password, newReadPassword, newWritePassword)
        .then(async ((result) => {
          logger.debug("Changed passwords");
          channelPasswordMap[channelName] = newReadPassword;
          channelWritePasswordMap[channelName] = newWritePassword;
          await (networkAPI.leaveChannel(channelHash(channelName)));
          await (networkAPI.joinChannel(ipfs, channel, userInfo.id, newReadPassword));
          cb(null);
        }))
        .catch((err) => {
          logger.error("Couldn't change passwords:", err);
          cb(err);
        });
    }));

    // -- API, no credentials/password --

    socket.on(ApiMessages.channel.info, async ((channelName, cb) => {
      networkAPI.getChannelInfo(ipfs, channelHash(channelName), userInfo.id)
        .then(cb)
        .catch((err) => {
          cb(null);
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
      cb({ username: userInfo.username });
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
      ipfs = null;
      userInfo = {};
      events.emit('disconnect');
    }));

    socket.on(ApiMessages.register, async (function (network, username, password) {
      events.emit('onRegister', network, username, password, (err, res) => {
        if(!err) {
          // userInfo = res.user;
          // ipfs     = res.ipfs;
          socket.emit('registered', { username: userInfo.username });
          events.emit('connect');
        } else {
          socket.emit('log', "register error: " + err);
          socket.emit('register.error', JSON.stringify(err.toString()));
        }
      });
    }));

    events.on('onIpfsStarted', (res) => {
      logger.debug("SocketApi ready");
      userInfo = res.user;
      ipfs     = res.ipfs;
    });
  }));
})

module.exports = SocketApi;
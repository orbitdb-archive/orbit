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

/* SOCKET API */
var SocketApi = async ((socketServer, httpServer, events, handler) => {
  logger.debug("Starting socket server");

  var io = socketIo(socketServer);
  socketServer.listen(httpServer);

  var socket = null;
  let orbit;

  const onNetwork = (orbitdb) => {
    if(orbitdb)
      orbit = orbitdb;

    if(socket) {
      const network = orbit ? {
        name: orbit.network.name,
        host: orbit.network.host,
        user: orbit.user
      } : null;
      socket.emit('network', network);
    }
  };

  const onError = (err) => {
    if(socket) socket.emit('orbit.error', err);
  };

  var onNewMessages = (channel, data) => {
    if(socket) socket.emit('messages', channel, data);
  };

  const onChannelsUpdated = (channels) => {
    if(socket) socket.emit(ApiMessages.channels.updated, channels);
  };

  events.removeListener('orbit.error', onError);
  events.removeListener('network', onNetwork);
  events.removeListener('message', onNewMessages);
  events.removeListener('channels.updated', onChannelsUpdated);
  events.on('orbit.error', onError);
  events.on('network', onNetwork);
  events.on('message', onNewMessages);
  events.on('channels.updated', onChannelsUpdated);

  io.on('connection', async (function (s) {
    logger.debug("UI connected");
    socket = s;
    events.emit('socket.connected', socket);

    socket.on(ApiMessages.error, (err) => {
      logger.error("Socket error: ")
      logger.error(err.stack)
    });

    socket.on('disconnect', async (() => {
      logger.warn("UI disconnected");
      orbit = null;
    }));

    socket.on(ApiMessages.network.disconnect, async (() => {
      orbit = null;
      handler.disconnect();
    }));

    socket.on(ApiMessages.register, handler.connect);
    socket.on(ApiMessages.channels.get, handler.getChannels);
    socket.on(ApiMessages.channel.join, handler.join);
    socket.on(ApiMessages.channel.messages, handler.getMessages);
    socket.on(ApiMessages.message.send, handler.sendMessage);
    socket.on(ApiMessages.user.get, handler.getUser);

    /* TODO */
    socket.on(ApiMessages.channel.part, handler.leave);
    // socket.on(ApiMessages.file.add, handler.addFile);
    // socket.on(ApiMessages.list.get, handler.getList);
    // socket.on(ApiMessages.swarm.peers, handler.getSwarmPeers);

    // socket.on(ApiMessages.channel.setMode, handler.setMode);


    // socket.on(ApiMessages.channel.part, async (function (channelName) {
    //   logger.debug("Leave channel #" + channelName);
    //   delete channelPasswordMap[channelName];
    //   await (networkAPI.leaveChannel(channelName));
    // }));

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

    socket.on(ApiMessages.swarm.peers, async((cb) => {
      ipfsAPI.swarmPeers(ipfs)
        .then((peers) => cb(peers.Strings))
        .catch((err) => {
          logger.warn("swarm.get", err);
          cb([]);
        });
    }));
  }));
});

module.exports = SocketApi;

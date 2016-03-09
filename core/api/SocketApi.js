'use strict';

var _           = require('lodash');
var Base58      = require('bs58');
var crypto      = require('crypto');
var async       = require('asyncawait/async');
var await       = require('asyncawait/await');
var socketIo    = require('socket.io');
var logger      = require('../logger');
var networkAPI  = require('../network-api');
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
    socket.on(ApiMessages.channel.part, handler.leave);
    socket.on(ApiMessages.file.add, handler.addFile);

    /* TODO */
    // socket.on(ApiMessages.file.get, handler.getList);
    // socket.on(ApiMessages.swarm.peers, handler.getSwarmPeers);
    // socket.on(ApiMessages.channel.setMode, handler.setMode);

    // socket.on(ApiMessages.list.get, async (function(hash, cb) {
    //   if(!simpleCache[hash]) {
    //     ipfsAPI.ls(ipfs, hash)
    //       .then(function(result) {
    //         if(result.Objects) {
    //           simpleCache[hash] = result.Objects[0].Links;
    //           cb(result.Objects[0].Links);
    //         }
    //       })
    //       .catch(function(err) {
    //         logger.error("Error in list.get", err);
    //         cb(null);
    //       });
    //   } else {
    //     cb(simpleCache[hash]);
    //   }
    // }));

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

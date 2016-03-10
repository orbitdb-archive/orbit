'use strict';

var async       = require('asyncawait/async');
var await       = require('asyncawait/await');
var socketIo    = require('socket.io');
var logger      = require('orbit-common/lib/logger');
var ApiMessages = require('../ApiMessages');

/* SOCKET API */
var SocketApi = async ((socketServer, httpServer, events, handler) => {
  logger.debug("Starting socket server");

  var io = socketIo(socketServer);
  socketServer.listen(httpServer);

  var socket = null;
  let orbit;

  const onNetwork = (orbit) => {
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
      // orbit = null;
    }));

    socket.on(ApiMessages.network.disconnect, async (() => {
      // orbit = null;
      handler.disconnect();
    }));

    socket.on(ApiMessages.register, handler.connect);
    socket.on(ApiMessages.channels.get, handler.getChannels);
    socket.on(ApiMessages.channel.join, handler.join);
    socket.on(ApiMessages.channel.part, handler.leave);
    socket.on(ApiMessages.channel.messages, handler.getMessages);
    socket.on(ApiMessages.user.get, handler.getUser);
    socket.on(ApiMessages.message.send, handler.sendMessage);
    socket.on(ApiMessages.file.add, handler.addFile);
    socket.on(ApiMessages.directory.get, handler.getDirectory);

    /* TODO */
    // socket.on(ApiMessages.swarm.peers, handler.getSwarmPeers);
    // socket.on(ApiMessages.channel.setMode, handler.setMode);

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

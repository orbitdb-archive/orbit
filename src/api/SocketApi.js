'use strict';

const socketIo    = require('socket.io');
const logger      = require('logplease').create("Orbit.SocketApi");
const ApiMessages = require('../ApiMessages');

/* SOCKET API */
var SocketApi = (socketServer, httpServer, events, orbit) => {
  logger.debug("Starting socket server");

  let socket = null;
  // const io = socketIo(socketServer);
  // socketServer.listen(httpServer);
  const io = socketIo(80);

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

  const onChannelsUpdated = (channels) => {
    if(socket) socket.emit(ApiMessages.channels.updated, channels);
  };

  const onData = (channel, hash) => {
    if(socket) socket.emit('data', channel, hash);
  };

  const onLoad = (channel) => {
    if(socket) socket.emit('load', channel);
  };

  const onReady = (channel) => {
    if(socket) socket.emit('ready', channel);
  }

  const onSync = (channel) => {
    if(socket) socket.emit('sync', channel);
  };

  const onSynced = (channel, items) => {
    if(socket) socket.emit('synced', channel, items);
  };

  events.removeListener('orbit.error', onError);
  events.removeListener('network', onNetwork);
  events.removeListener('channels.updated', onChannelsUpdated);
  events.on('orbit.error', onError);
  events.on('network', onNetwork);
  events.on('channels.updated', onChannelsUpdated);

  events.removeListener('data', onData);
  events.removeListener('load', onLoad);
  events.removeListener('ready', onReady);
  events.removeListener('sync', onSync);
  events.removeListener('synced', onSynced);
  events.on('data', onData);
  events.on('load', onLoad);
  events.on('ready', onReady);
  events.on('sync', onSync);
  events.on('synced', onSynced);

  io.on('connection', (s) => {
    logger.debug("UI connected");
    socket = s;
    events.emit('socket.connected', socket);

    socket.on(ApiMessages.error, (err) => {
      logger.error("Socket error: ")
      logger.error(err.stack)
    });

    socket.on('disconnect', () => {
      logger.warn("UI disconnected");
    });

    socket.on(ApiMessages.network.disconnect, () => orbit.disconnect());
    socket.on(ApiMessages.register, (host, username, password) => orbit.connect(host, username, password));
    socket.on(ApiMessages.channels.get, (cb) => orbit.getChannels(cb));
    socket.on(ApiMessages.channel.join, (channel, password, cb) => orbit.join(channel, password, cb));
    socket.on(ApiMessages.channel.part, (channel) => orbit.leave(channel));
    socket.on(ApiMessages.channel.messages, (channel, lessThanHash, greaterThanHash, amount, callback) => orbit.getMessages(channel, lessThanHash, greaterThanHash, amount, callback));
    socket.on(ApiMessages.post.get, (hash, callback) => orbit.getPost(hash, callback));
    socket.on(ApiMessages.user.get, (hash, cb) => orbit.getUser(hash, cb));
    socket.on(ApiMessages.message.send, (channel, message, cb) => orbit.sendMessage(channel, message, cb));
    socket.on(ApiMessages.file.add, (channel, filePath, cb) => orbit.addFile(channel, filePath, cb));
    socket.on(ApiMessages.directory.get, (hash, cb) => orbit.getDirectory(hash, cb));
    socket.on(ApiMessages.file.get, (hash, cb) => orbit.getFile(hash, cb));
    socket.on(ApiMessages.swarm.peers, (cb) => orbit.getSwarmPeers(cb));
  });

};

module.exports = SocketApi;

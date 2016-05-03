'use strict';

const socketIo    = require('socket.io');
const logger      = require('logplease').create("Orbit.SocketApi");
const ApiMessages = require('../ApiMessages');

/* SOCKET API */
var SocketApi = (socketServer, httpServer, events, orbit) => {
  logger.debug("Starting socket server");

  let socket = null;
  const io = socketIo(socketServer);
  socketServer.listen(httpServer);

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

  const onNewMessages = (channel, data) => {
    if(socket) socket.emit('messages', channel, data);
  };

  const onChannelsUpdated = (channels) => {
    if(socket) socket.emit(ApiMessages.channels.updated, channels);
  };

  const onLoading = (channel) => {
    if(socket) socket.emit('db.load', channel);
  };

  const onLoaded = (channel) => {
    if(socket) socket.emit('readable', channel);
  };

  events.removeListener('orbit.error', onError);
  events.removeListener('network', onNetwork);
  events.removeListener('message', onNewMessages);
  events.removeListener('channels.updated', onChannelsUpdated);
  events.removeListener('db.load', onLoading);
  events.removeListener('readable', onLoaded);
  events.on('orbit.error', onError);
  events.on('network', onNetwork);
  events.on('message', onNewMessages);
  events.on('channels.updated', onChannelsUpdated);
  events.on('db.load', onLoading);
  events.on('readable', onLoaded);

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

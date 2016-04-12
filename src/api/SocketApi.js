'use strict';

const async       = require('asyncawait/async');
const socketIo    = require('socket.io');
const logger      = require('orbit-common/lib/logger')("Orbit.SocketApi");
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

  const onLoading = (action, channel) => {
    if(socket) socket.emit('db.load', action, channel);
  };

  const onLoaded = (action, channel) => {
    if(socket) socket.emit('db.loaded', action, channel);
  };

  events.removeListener('orbit.error', onError);
  events.removeListener('network', onNetwork);
  events.removeListener('message', onNewMessages);
  events.removeListener('channels.updated', onChannelsUpdated);
  events.removeListener('db.load', onLoading);
  events.removeListener('db.loaded', onLoaded);
  events.on('orbit.error', onError);
  events.on('network', onNetwork);
  events.on('message', onNewMessages);
  events.on('channels.updated', onChannelsUpdated);
  events.on('db.load', onLoading);
  events.on('db.loaded', onLoaded);

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

    socket.on(ApiMessages.network.disconnect, async(() => orbit.disconnect()));
    socket.on(ApiMessages.register, async((host, username, password) => orbit.connect(host, username, password)));
    socket.on(ApiMessages.channels.get, async((cb) => orbit.getChannels(cb)));
    socket.on(ApiMessages.channel.join, async((channel, password, cb) => orbit.join(channel, password, cb)));
    socket.on(ApiMessages.channel.part, async((channel) => orbit.leave(channel)));
    socket.on(ApiMessages.channel.messages, async((channel, lessThanHash, greaterThanHash, amount, callback) => orbit.getMessages(channel, lessThanHash, greaterThanHash, amount, callback)));
    socket.on(ApiMessages.post.get, async((hash, callback) => orbit.getPost(hash, callback)));
    socket.on(ApiMessages.user.get, async((hash, cb) => orbit.getUser(hash, cb)));
    socket.on(ApiMessages.message.send, async((channel, message, cb) => orbit.sendMessage(channel, message, cb)));
    socket.on(ApiMessages.file.add, async((channel, filePath, cb) => orbit.addFile(channel, filePath, cb)));
    socket.on(ApiMessages.directory.get, async((hash, cb) => orbit.getDirectory(hash, cb)));
    socket.on(ApiMessages.swarm.peers, async((cb) => orbit.getSwarmPeers(cb)));
  });

};

module.exports = SocketApi;

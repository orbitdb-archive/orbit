'use strict';

const async     = require('asyncawait/async');
const await     = require('asyncawait/await');
var socketIo    = require('socket.io');
var logger      = require('orbit-common/lib/logger');
var ApiMessages = require('../ApiMessages');

/* SOCKET API */
var SocketApi = (socketServer, httpServer, events, handler) => {
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

    socket.on(ApiMessages.network.disconnect, async(() => handler.disconnect()));
    socket.on(ApiMessages.register, async((host, username, password) => handler.connect(host, username, password)));
    socket.on(ApiMessages.channels.get, async((cb) => handler.getChannels(cb)));
    socket.on(ApiMessages.channel.join, async((channel, password, cb) => handler.join(channel, password, cb)));
    socket.on(ApiMessages.channel.part, async((channel) => handler.leave(channel)));
    socket.on(ApiMessages.channel.messages, async((channel, lessThanHash, greaterThanHash, amount, callback) => handler.getMessages(channel, lessThanHash, greaterThanHash, amount, callback)));
    socket.on(ApiMessages.post.get, async((hash, callback) => handler.getPost(hash, callback)));
    socket.on(ApiMessages.user.get, async((hash, cb) => handler.getUser(hash, cb)));
    socket.on(ApiMessages.message.send, async((channel, message, cb) => handler.sendMessage(channel, message, cb)));
    socket.on(ApiMessages.file.add, async((channel, filePath, cb) => handler.addFile(channel, filePath, cb)));
    socket.on(ApiMessages.directory.get, async((hash, cb) => handler.getDirectory(hash, cb)));
    socket.on(ApiMessages.swarm.peers, async((cb) => handler.getSwarmPeers(cb)));
    /* TODO */
    // socket.on(ApiMessages.channel.setMode, handler.setMode);
  });

};

module.exports = SocketApi;

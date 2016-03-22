'use strict';

import _ from 'lodash';
import Reflux from 'reflux';
import Actions from 'actions/SendMessageAction';
import NetworkActions from 'actions/NetworkActions';
import ChannelActions from 'actions/ChannelActions';
import SocketActions from 'actions/SocketActions';

var channelPasswords = {};

var messagesBatchSize = 16;

var MessageStore = Reflux.createStore({
  listenables: [Actions, NetworkActions, SocketActions, ChannelActions],
  init: function() {
    this.messages    = {};
    this.contents    = {};
    this.socket      = null;
    this.loading     = false;
    this.posts       = {}; // simple cache for message contents
    this.canLoadMore = true;
  },
  getLatestMessage: function(channel: string) {
    return this.messages[channel] && this.messages[channel].length > 0 ? this.messages[channel][this.messages[channel].length - 1].key : null;
  },
  getOldestMessage: function(channel: string) {
    return this.messages[channel] && this.messages[channel].length > 0 ? this.messages[channel][0].key : null;
  },
  getMessages: function(channel: string) {
    if(!this.messages[channel])
      this.loadMessages(channel, null, null, messagesBatchSize);

    return this.messages[channel] ? this.messages[channel] : [];
  },
  onSocketConnected: function(socket) {
    console.log("MessageStore connected");
    this.socket = socket;
    this.socket.on('messages', (channel, message) => {
      console.log("--> new messages in #", channel, message);
      this.canLoadMore = true;
      // this.loadMessages(channel, null, this.getLatestMessage(channel), messagesBatchSize);
      this.loadMessages(channel, null, null, messagesBatchSize);
    });
    this.socket.on('db.load', (channel, hash) => {
      console.log("--> loading data for #", channel, hash);
      Actions.startLoading(channel, "Loading messages...");
    });
    this.socket.on('db.loaded', (channel, hash) => {
      // console.log("--> done loading #", channel, hash);
      Actions.stopLoading(channel);
    });
  },
  onSocketDisconnected: function() {
    this.socket.removeAllListeners('messages');
    this.socket = null;
    this.messages = {};
    this.contents = {};
    this.canLoadMore  = true;
  },
  onDisconnect: function() {
    this.messages = {};
    this.contents = {};
    this.loading = false;
    this.canLoadMore = true;
  },
  onJoinedChannel: function(channel) {
    console.log("MessageStore - open #" + channel);
    if(!this.messages[channel]) this.messages[channel] = [];
    this.canLoadMore = true;
    this.loading = false;
    // this.loadMessages(channel, null, this.getLatestMessage(channel), messagesBatchSize);
    this.loadMessages(channel, null, null, messagesBatchSize);
  },
  onLeaveChannel: function(channel: string) {
    console.log("MessageStore - close #" + channel);
    this.canLoadMore = true;
    this.loading = false;
    delete this.messages[channel];
  },
  onOpenChannel: function(channel: string) {
    MessageStore.canLoadMore = true;
    MessageStore.loading = false;
  },
  loadMessages: function(channel: string, olderThanHash: string, newerThanHash: string, amount: number) {
    if(!this.socket) {
      console.error("Socket not connected");
      return;
    }

    console.log("--> channel.get: ", channel, olderThanHash, newerThanHash, amount);
    this.loading = true;
    this.socket.emit('channel.get', channel, olderThanHash, newerThanHash, amount, this.addMessages);
  },
  addMessages: function(channel: string, newMessages: Array) {
    if(channel && newMessages) {
      console.log("<-- messages: ", channel, newMessages.length, newMessages);
      var unique    = _.differenceWith(newMessages, this.messages[channel], _.isEqual);
      // console.log("<-- new messages: ", unique.length);
      if(!this.messages[channel]) this.messages[channel] = [];
      var all = this.messages[channel].concat(unique);
      this.messages[channel] = all;
      this.loading = false;
      // console.log(this.messages[channel][this.messages[channel].length -1].hash === newMessages[newMessages.length - 1].hash);
      // if(this.messages[channel][this.messages[channel].length - 1].hash === newMessages[newMessages.length - 1].hash) this.canLoadMore = false;
      // Actions.stopLoading(channel);
      this.trigger(channel, this.messages[channel]);
    }
  },
  onLoadOlderMessages: function(channel: string) {
    // if(!this.loading) {
    console.log("load more messages from #" + channel, this.canLoadMore, this.loading);
    if(!this.loading && this.canLoadMore) {
      this.loading = true;
      this.canLoadMore = false;
      Actions.startLoading(channel, "Loading older messages...");
      const oldestHash = this.getOldestMessage(channel);
      // this.loadMessages(channel, oldestHash, null, messagesBatchSize);
      console.log("--> channel.get: ", channel, "older than:", oldestHash, messagesBatchSize);
      this.socket.emit('channel.get', channel, oldestHash, null, messagesBatchSize, (c, newMessages) => {
        console.log("<-- messages: ", channel, newMessages.length, newMessages, "are older than:", oldestHash);
        const diff = _.differenceWith(newMessages, this.messages[channel], _.isEqual);
        // console.log("DIFF", diff, this.messages[channel]);
        if(diff.length > 0) {
          const all = diff.concat(this.messages[channel]);
          this.messages[channel] = all;
          this.canLoadMore = true;
          this.trigger(channel, this.messages[channel]);
        }
        this.loading = false;
        Actions.stopLoading(channel);
      });
    }
  },
  onLoadPost: function(hash: string, callback) {
    if(!this.posts[hash]) {
      this.socket.emit('post.get', hash, (err, data) => {
        this.posts[hash] = data;
        callback(err, data);
      });
    } else {
      callback(null, this.posts[hash]);
    }
  },
  onSendMessage: function(channel: string, text: string, callback) {
    if(!this.socket) {
      console.error("Socket not connected");
      return;
    }

    console.log("--> send message:", text);
    // Actions.startLoading(channel);
    this.socket.emit('message.send', channel, text, (err) => {
      if(err) {
        console.log("Couldn't send message:", err.toString());
        Actions.raiseError(err.toString());
      }
      // Actions.stopLoading(channel);
    });
  },
  onAddFile: function(channel: string, filePath: string) {
    if(!this.socket) {
      console.error("Socket not connected");
      return;
    }

    console.log("--> add file:", filePath);
    Actions.startLoading(channel);
    this.socket.emit('file.add', channel, filePath, (err) => {
      if(err) {
        console.log("Couldn't add file:", filePath, err.toString());
        Actions.raiseError(err.toString());
      }
      Actions.stopLoading(channel);
    });
  },
  onLoadDirectoryInfo: function(hash, cb) {
    console.log("--> get directory:", hash);
    if(hash) {
      this.socket.emit('directory.get', hash, (result) => {
        console.log("<-- directory:", result);
        if(result) {
          result = result.map((e) => {
            return {
              hash: e.Hash,
              size: e.Size,
              type: e.Type === 1 ? "directory" : "file",
              name: e.Name
            };
          });
        }
        cb(result);
      });
    } else {
      cb(null);
    }
  }
});

export default MessageStore;

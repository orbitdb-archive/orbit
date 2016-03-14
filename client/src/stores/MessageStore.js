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
    // this.canLoadMore = true;
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
      // this.canLoadMore = true;
      this.loadMessages(channel, null, this.getLatestMessage(channel), messagesBatchSize);
    });
  },
  onSocketDisconnected: function() {
    this.socket.removeAllListeners('messages');
    this.socket = null;
    this.messages = {};
    this.contents = {};
  },
  onDisconnect: function() {
    this.messages     = {};
    this.contents     = {};
    this.loading      = false;
    // this.canLoadMore  = true;
  },
  onJoinedChannel: function(channel) {
    console.log("MessageStore - open #" + channel);
    if(!this.messages[channel]) this.messages[channel] = [];
  },
  onLeaveChannel: function(channel: string) {
    console.log("MessageStore - close #" + channel);
    delete this.messages[channel];
  },
  loadMessages: function(channel: string, olderThanHash: string, newerThanHash: string, amount: number) {
    if(!this.socket) {
      console.error("Socket not connected");
      return;
    }

    console.log("--> channel.get: ", channel, olderThanHash, newerThanHash, this.messages[channel] && this.messages[channel].length > 0 ? this.messages[channel][0].hash : "", amount);
    Actions.startLoading(channel);
    this.loading = true;
    this.socket.emit('channel.get', channel, olderThanHash, newerThanHash, amount, this.addMessages);
  },
  addMessages: function(channel: string, newMessages: Array) {
    if(channel && newMessages) {
      console.log("<-- messages: ", channel, newMessages.length, newMessages);
      var unique    = _.differenceWith(newMessages, this.messages[channel], _.isEqual);
      console.log("<-- new messages: ", unique.length);
      if(!this.messages[channel]) this.messages[channel] = [];
      var all       = this.messages[channel].concat(unique);
      this.messages[channel] = all;
      this.loading  = false;
      // if(newMessages.length > 1) this.canLoadMore = true;
      // Actions.stopLoading(channel);
      this.trigger(channel, this.messages[channel]);
    }
  },
  onLoadOlderMessages: function(channel: string) {
    console.log("load more messages from #" + channel);
    // if(!this.loading && this.canLoadMore) {
    if(!this.loading) {
      this.loading = true;
      // this.canLoadMore = false;
      Actions.startLoading(channel);
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
          // this.canLoadMore = true;
          this.trigger(channel, this.messages[channel]);
        }
        this.loading = false;
        Actions.stopLoading(channel);
      });
    }
  },
  onLoadPost: function(hash: string, callback) {
    this.socket.emit('post.get', hash, callback);
  },
  onSendMessage: function(channel: string, text: string, callback) {
    if(!this.socket) {
      console.error("Socket not connected");
      return;
    }

    console.log("--> send message:", text);
    Actions.startLoading(channel);
    this.socket.emit('message.send', channel, text, (err) => {
      if(err) {
        console.log("Couldn't send message:", err.toString());
        Actions.raiseError(err.toString());
      }
      Actions.stopLoading(channel);
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

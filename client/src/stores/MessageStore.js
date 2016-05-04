'use strict';

import _ from 'lodash';
import Reflux from 'reflux';
import UIActions from 'actions/UIActions';
import NetworkActions from 'actions/NetworkActions';
import ChannelActions from 'actions/ChannelActions';
import SocketActions from 'actions/SocketActions';
import NotificationActions from 'actions/NotificationActions';
import UserActions from 'actions/UserActions';
import ChannelStore from 'stores/ChannelStore';
import UserStore from 'stores/UserStore';
import Logger from 'logplease';
const logger = Logger.create('MessageStore', { color: Logger.Colors.Grey });

const messagesBatchSize = 8;

const MessageStore = Reflux.createStore({
  listenables: [UIActions, NetworkActions, SocketActions, ChannelActions],
  init: function() {
    this.socket = null;
    this.posts = {}; // simple cache for message contents
    this._reset();
    this.hasLoaded = false;

    // Listen for changes in channels
    this.unsubscribeFromChannelStore = ChannelStore.listen((channels) => {
      channels.forEach((channel) => {
        if(!this.messages[channel.name])
          this.messages[channel.name] = [];
      });
    });
  },
  _reset: function() {
    this.messages = {};
    this.contents = {};
    this._resetLoadingState();
  },
  _resetLoadingState: function() {
    this.loading = false;
    this.hasLoaded = true;
    this.canLoadMore = true;
  },
  getMessages: function(channel: string) {
    if(!this.messages[channel] || this.messages[channel].length === 0)
      this.loadMessages(channel, null, null, messagesBatchSize);

    return this.messages[channel] ? this.messages[channel] : [];
  },
  getOldestMessage: function(channel: string) {
    return this.messages[channel] && this.messages[channel].length > 0 ? this.messages[channel][0].hash : null;
  },
  onSocketConnected: function(socket) {
    logger.debug("connected");
    this.socket = socket;

    // Handle new messages
    this.socket.on('messages', (channel, message) => {
      logger.debug("--> new messages in #" + channel);
      console.log(message);
      this.loadMessages(channel, null, null, messagesBatchSize);
    });

    // Handle DB loading state
    this.socket.on('db.load', (channel) => {
      this.hasLoaded = false;
      UIActions.startLoading(channel, "loadhistory", "Syncing...");
    });
    this.socket.on('readable', (channel) => {
      this.hasLoaded = true;
      UIActions.stopLoading(channel, "loadhistory");
      this.loadMessages(channel, null, null, messagesBatchSize);
    });
  },
  onSocketDisconnected: function() {
    this.socket.removeAllListeners('messages');
    this.socket = null;
    this._reset();
  },
  onDisconnect: function() {
    this._reset();
  },
  onJoinedChannel: function(channel) {
    if(!this.messages[channel]) this.messages[channel] = [];
    this._resetLoadingState();
  },
  onLeaveChannel: function(channel: string) {
    this._resetLoadingState();
    delete this.messages[channel];
  },
  onShowChannel: function(channel: string) {
    if(!this.messages[channel]) this.messages[channel] = [];
    this._resetLoadingState();
  },
  onLoadMoreMessages: function(channel: string) {
    if(!this.loading && this.canLoadMore && this.hasLoaded) {
      logger.debug("load more messages from #" + channel);
      this.canLoadMore = false;
      this.loadMessages(channel, this.getOldestMessage(channel), null, messagesBatchSize);
    }
  },
  loadMessages: function(channel: string, olderThanHash: string, newerThanHash: string, amount: number) {
    if(!this.socket)
      return;

    logger.debug("--> #" + channel + ".get " + olderThanHash + " " + newerThanHash  + " " + amount);
    this.loading = true;
    UIActions.startLoading(channel, "loadmessages", "Loading messages...");
    this.socket.emit('channel.get', channel, olderThanHash, newerThanHash, amount, (c, messages) => {
      this._addMessages(channel, messages, olderThanHash !== null);
      this.loading = false;
      UIActions.stopLoading(channel, "loadmessages");
    });
  },
  _addMessages: function(channel: string, newMessages: Array, older: boolean) {
    logger.debug("<-- messages: " + channel + " - " + newMessages.length);
    console.log(newMessages);
    var unique = _.differenceWith(newMessages, this.messages[channel], _.isEqual);
    logger.debug("Unique new messages: " + unique.length);

    if(unique.length > 0) {
      // If we received more than 1 message, there are more messages to be loaded
      this.canLoadMore = true;
      if(unique.length === 1 && this.messages[channel].length === 0 && older) {
        // Special case for a channel that has only one message
        ChannelActions.reachedChannelStart();
      }

      // Append the new messages either at the end (newer) or at the beginning (older)
      if(older)
        this.messages[channel] = unique.concat(this.messages[channel]);
      else
        this.messages[channel] = this.messages[channel].concat(unique);

      // Load message content
      unique.reverse().forEach((f) => this._loadPost(channel, f));

      // Sort by timestamp
      this.messages[channel] = _.sortBy(this.messages[channel], (e) => e.meta.ts);

      NotificationActions.newMessage(channel);
      this.trigger(channel, this.messages[channel]);
    } else if(older) {
      ChannelActions.reachedChannelStart();
    } else if(!older && this.messages[channel].length === 0 && this.hasLoaded) {
      ChannelActions.reachedChannelStart();
    }
  },
  _loadPost: function(channel: string, message) {
    const hasMentions = (text: string, mention: string) => {
      return text.split(' ').map((word) => {
          const match = word.startsWith(mention)
                  || word.startsWith(mention + ":")
                  || word.startsWith("@" + mention)
                  || word.startsWith(mention + ",");
          return match;
      }).filter((f) => f === true).length > 0;
    };

    this.onLoadPost(message.value, (err, post) => {
      UserActions.addUser(post.meta.from);
      if(post && post.content) {
        if(hasMentions(post.content.toLowerCase(), UserStore.user.username.toLowerCase()))
          NotificationActions.mention(channel, post.content);
      }
    });
  },
  onLoadPost: function(hash: string, callback) {
    if(!this.socket)
      return;

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
    logger.debug("--> send message" + text);
    UIActions.startLoading(channel, "send");
    this.socket.emit('message.send', channel, text, (err) => {
      if(err) {
        logger.warn("Couldn't send message: " + err.toString());
        UIActions.raiseError(err.toString());
      }
      UIActions.stopLoading(channel, "send");
    });
  },
  onAddFile: function(channel: string, filePath: string) {
    logger.debug("--> add file: " + filePath);
    UIActions.startLoading(channel);
    this.socket.emit('file.add', channel, filePath, (err) => {
      if(err) {
        logger.warn("Couldn't add file: " + filePath + " - " + err.toString());
        UIActions.raiseError(err.toString());
      }
      UIActions.stopLoading(channel);
    });
  },
  onLoadDirectoryInfo: function(hash, cb) {
    if(!this.socket)
      return;

    if(hash) {
      this.socket.emit('directory.get', hash, (result) => {
        logger.debug("<-- received directory:");
        console.log(result);
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
  },
  onLoadFile: function(hash, cb) {
    if(!this.socket)
      return;

    if(hash) {
      this.socket.emit('file.get', hash, (result) => {
        logger.debug("<-- received file:");
        cb(result);
      });
    } else {
      cb(null);
    }
  }
});

export default MessageStore;

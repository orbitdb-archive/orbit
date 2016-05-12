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
const logger = Logger.create('MessageStore', { color: Logger.Colors.Magenta });

const messagesBatchSize = 8;

const MessageStore = Reflux.createStore({
  listenables: [UIActions, NetworkActions, SocketActions, ChannelActions],
  init: function() {
    this.socket = null;
    this.currentChannel = null;
    this.channels = {};
    this.posts = {}; // simple cache for message contents
    this._reset();
  },
  _reset: function() {
    this._resetChannelState(this.currentChannel);
    this.channels = {};
    this.posts = {};
    this.currentChannel = null;
  },
  _resetChannelState: function(channel) {
    if(channel) {
      UIActions.stopLoading(channel, "sync");
      UIActions.stopLoading(channel, "loadhistory");
      this.channels[channel].isReady = false;
      this.channels[channel].loading = false;
      this.channels[channel].canLoadMore = true;
    }
  },
  getOldestMessage: function(channel: string) {
    return this.channels[channel] && this.channels[channel].messages.length > 0 ? this.channels[channel].messages[0].hash : null;
  },
  onSocketConnected: function(socket) {
    logger.debug("connected");
    this.socket = socket;

    // Handle new messages
    this.socket.on('data', (channel, hash) => {
      console.log("DATA", channel, hash);
      logger.debug("--> new messages in #" + channel);
      this.loadMessages(channel, null, null, messagesBatchSize);
    });

    // Handle DB loading state
    this.socket.on('load', (channel) => {
      console.log("LOAD", channel);
      this.channels[channel].loading = true;
      this.channels[channel].isReady = false;
      // UIActions.stopLoading(this.currentChannel, "loadhistory");
      UIActions.startLoading(channel, "loadhistory", "Connecting...");
      this.connectTimeout = setTimeout(() => {
        UIActions.startLoading(channel, "loadhistory", `Connecting to the channel is taking a long time. This usually means connection problems with the network.`);
      }, 5000);
    });
    this.socket.on('ready', (channel) => {
      clearTimeout(this.connectTimeout);
      console.log("READY", channel);
      this.channels[channel].loading = false;
      this.channels[channel].isReady = true;
      UIActions.stopLoading(channel, "loadhistory");
    });
    this.socket.on('sync', (channel) => {
      console.log("SYNC", channel);
      this.channels[channel].isReady = false;
      UIActions.stopLoading(this.currentChannel, "sync");
      UIActions.startLoading(channel, "sync", "Syncing...");
      this.syncTimeout = setTimeout(() => {
        UIActions.startLoading(channel, "sync", "Syncing is taking a long time. This usually means connection problems with the network.");
      }, 5000);
    });
    this.socket.on('synced', (channel, items) => {
      clearTimeout(this.syncTimeout);
      clearTimeout(this.connectTimeout);
      console.log("SYNCED", channel);
      this.channels[channel].isReady = true;
      UIActions.stopLoading(channel, "sync");
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
  onJoinChannel: function(channel, password) {
    this._resetChannelState(this.currentChannel);
    this.channels[channel] = { messages: [], isReady: false, loading: false, canLoadMore: true };
  },
  onJoinedChannel: function(channel) {
    // console.log("JOINED", channel, this.channels)
    this.currentChannel = channel;
  },
  onLeaveChannel: function(channel: string) {
    this._resetChannelState(channel);
  },
  onLoadMessages: function(channel: string) {
    // console.log("LOAD MESSAGES", channel, this.channels[channel])
    if(this.channels[channel])
      this.trigger(channel, this.channels[channel].messages);
  },
  onLoadMoreMessages: function(channel: string) {
    // console.log("TRY LOAD", channel, this.currentChannel, this.channels[channel].loading, this.channels[channel].canLoadMore, this.channels[channel].isReady)
    if(channel !== this.currentChannel)
      return;

    if(!this.channels[channel].loading && this.channels[channel].canLoadMore && this.channels[channel].isReady) {
      logger.debug("load more messages from #" + channel);
      this.channels[channel].canLoadMore = true;
      this.loadMessages(channel, this.getOldestMessage(channel), null, messagesBatchSize);
    }
  },
  loadMessages: function(channel: string, olderThanHash: string, newerThanHash: string, amount: number) {
    if(!this.socket)
      return;

    logger.debug("--> GET MESSAGES #" + channel + ", " + olderThanHash + " " + newerThanHash  + " " + amount);
    this.channels[channel].loading = true;
    UIActions.startLoading(channel, "loadmessages", "Loading messages...");
    this.socket.emit('channel.get', channel, olderThanHash, newerThanHash, amount, (c, messages) => {
      this._addMessages(channel, messages, olderThanHash !== null);
      this.channels[channel].loading = false;
      UIActions.stopLoading(channel, "loadmessages");
    });
  },
  _addMessages: function(channel: string, newMessages: Array, older: boolean) {
    logger.debug("<-- messages: " + channel + " - " + newMessages.length);
    console.log(newMessages);
    var unique = _.differenceWith(newMessages, this.channels[channel].messages, _.isEqual);
    logger.debug("Unique new messages: " + unique.length);

    if(unique.length > 0) {
      // If we received more than 1 message, there are more messages to be loaded
      // this.canLoadMore = true;
      this.channels[channel].canLoadMore = true;
      if(unique.length === 1 && this.channels[channel].messages.length === 0 && older) {
        // Special case for a channel that has only one message
        ChannelActions.reachedChannelStart();
      }

      // Append the new messages either at the end (newer) or at the beginning (older)
      if(older)
        this.channels[channel].messages = unique.concat(this.channels[channel].messages);
      else
        this.channels[channel].messages = this.channels[channel].messages.concat(unique);

      // Load message content
      unique.reverse().forEach((f) => this._loadPost(channel, f.payload));

      // Sort by timestamp
      this.channels[channel].messages = _.sortBy(this.channels[channel].messages, (e) => e.payload.meta.ts);

      NotificationActions.newMessage(channel);
      this.trigger(channel, this.channels[channel].messages);
    } else if(older) {
      this.channels[channel].canLoadMore = false;
      ChannelActions.reachedChannelStart();
    } else if(!older && this.channels[channel].messages.length === 0 && this.channels[channel].isReady) {
      this.channels[channel].canLoadMore = false;
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

'use strict';

import _ from 'lodash';
import Reflux from 'reflux';
import AppActions from 'actions/AppActions';
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
  listenables: [AppActions, UIActions, NetworkActions, SocketActions, ChannelActions],
  init: function() {
    this.socket = null;
    this.currentChannel = null;
    this.channels = {};
    this.posts = {}; // simple cache for message contents
    this._reset();
    this.stopListeningChannelUpdates = ChannelStore.listen((channels) => {
      const channel = channels.find((e) => e.name === this.currentChannel);
      // logger.debug("Channels state updated for", channel)
      if(channel)
      this._updateLoadingState(channel);
    });

    // debug
    const s = (channel, text) => {
      return new Promise((resolve, reject) => {
        set
      });
    };
    window.send = (amount, interval) => {
      let i = 0;
      let timer = setInterval(() => {
        this.onSendMessage(this.currentChannel, "hello " + i);
        i ++;
        if(i === amount) clearInterval(timer);
      }, interval);
    };
  },
  onInitialize: function(orbit) {
    this.orbit = orbit;
    const self = this;
    this.orbit.events.on('data', (channel, hash) => {
      logger.info("New messages in #" + channel)
      self.loadMessages(channel, null, null, messagesBatchSize);
    });
    this.orbit.events.on('load', (channel) => {
    });
    this.orbit.events.on('ready', (channel) => {
      this.channels[channel].canLoadMore = true;
    });
    this.orbit.events.on('sync', (channel) => {
    });
    this.orbit.events.on('synced', (channel, items) => {
      logger.info("Channel synced: #" + channel)
      self.channels[channel].canLoadMore = true;
      if(self.channels[channel] && !self.channels[channel].loading)
        self.loadMessages(channel, null, null, messagesBatchSize);
    });
  },
  _updateLoadingState: function(channel) {
    logger.debug("Update channel state", channel);
    if(channel) {
      this.channels[channel.name].isReady = !channel.state.loading && !channel.state.syncing;
      this.channels[channel.name].loading = channel.state.loading;
      this.channels[channel.name].syncing = channel.state.syncing;

      if(channel.state.loading) {
        UIActions.startLoading(channel.name, "loadhistory", "Connecting...");
        if(this.connectTimeout[channel.name]) clearTimeout(this.connectTimeout[channel.name]);
        this.connectTimeout[channel.name] = setTimeout(() => {
          UIActions.startLoading(channel.name, "loadhistory", `Connecting to the channel is taking a long time. This usually means connection problems with the network.`);
        }, 10000);
      } else {
        clearTimeout(this.connectTimeout[channel.name]);
        delete this.connectTimeout[channel.name];
        UIActions.stopLoading(channel.name, "loadhistory");
      }

      if(channel.state.syncing > 0 && !this.syncTimeout[channel.name]) {
        logger.debug("Syncing");
        UIActions.startLoading(channel.name, "sync", "Syncing...");
        if(this.syncTimeout[channel.name]) clearTimeout(this.syncTimeout[channel.name]);
        this.syncTimeout[channel.name] = setTimeout(() => {
          UIActions.startLoading(channel.name, "synctimeout", "Syncing is taking a long time. This usually means connection problems with the network.");
        }, 10000);
      } else {
        logger.debug("Clear");
        clearTimeout(this.syncTimeout[channel.name]);
        delete this.syncTimeout[channel.name];
        UIActions.stopLoading(channel.name, "sync");
        UIActions.stopLoading(channel.name, "synctimeout");
      }
    }
  },
  _reset: function() {
    this.channels = {};
    this.posts = {};
    this.currentChannel = null;
    this.syncTimeout = {};
    this.connectTimeout = {};
  },
  _resetChannelState: function(channel) {
    if(this.syncTimeout[channel]) clearTimeout(this.syncTimeout[channel]);
    if(this.connectTimeout[channel]) clearTimeout(this.connectTimeout[channel]);
    delete this.syncTimeout[channel];
    delete this.connectTimeout[channel];
    if(channel) {
      this.channels[channel].isReady = false;
      this.channels[channel].loading = false;
      // this.channels[channel].syncing = false;
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
      // console.log("DATA", channel, hash);
      logger.debug("--> new messages in #" + channel);
      this.loadMessages(channel, null, null, messagesBatchSize);
    });

    // Handle DB loading state
    this.socket.on('load', (channel) => {
      // console.log("LOAD", channel);
      // this.channels[channel].canLoadMore = false;
    });
    this.socket.on('ready', (channel) => {
      // console.log("READY", channel);
      // this.channels[channel].canLoadMore = true;
    });
    this.socket.on('sync', (channel) => {
      // console.log("SYNC", channel);
      // this.channels[channel].canLoadMore = false;
    });
    this.socket.on('synced', (channel, items) => {
      console.log("SYNCED", channel, items);
      this.channels[channel].canLoadMore = true;
      if(this.channels[channel] && !this.channels[channel].loading)
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
  onJoinChannel: function(channel, password) {
    this._resetChannelState(this.currentChannel);
    this.channels[channel] = { messages: [], isReady: false, loading: false, canLoadMore: true };
    this.currentChannel = channel;
  },
  onJoinedChannel: function(channel) {
    // console.log("JOINED", channel, this.channels)
    // this.currentChannel = channel;
    // const c = ChannelStore.channels.find((e) => e.name === this.currentChannel);
    // this._updateLoadingState(c);
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
    console.log("TRY LOAD", channel, this.currentChannel)
    if(channel !== this.currentChannel)
      return;

    if(!this.channels[channel].loading && this.channels[channel].canLoadMore) {
      logger.debug("load more messages from #" + channel);
      this.channels[channel].canLoadMore = true;
      this.loadMessages(channel, this.getOldestMessage(channel), null, messagesBatchSize);
    }
  },
  loadMessages: function(channel: string, olderThanHash: string, newerThanHash: string, amount: number) {
    // if(!this.socket)
    //   return;
    logger.debug("--> GET MESSAGES #" + channel + ", " + olderThanHash + " " + newerThanHash  + " " + amount);
    this.channels[channel].loading = true;
    UIActions.startLoading(channel, "loadmessages", "Loading messages...");
    this.orbit.getMessages(channel, olderThanHash, newerThanHash, amount, (messages) => {
      this._addMessages(channel, messages, olderThanHash !== null);
      this.channels[channel].loading = false;
      UIActions.stopLoading(channel, "loadmessages");
    });
    // this.socket.emit('channel.get', channel, olderThanHash, newerThanHash, amount, (c, messages) => {
    //   this._addMessages(channel, messages, olderThanHash !== null);
    //   this.channels[channel].loading = false;
    //   UIActions.stopLoading(channel, "loadmessages");
    // });
  },
  _addMessages: function(channel: string, newMessages: Array, older: boolean) {
    logger.debug("<-- messages: " + channel + " - " + newMessages.length);
    console.log(newMessages);
    var unique = _.differenceWith(newMessages, this.channels[channel].messages, _.isEqual);
    logger.debug("Unique new messages: " + unique.length);

    if(unique.length > 0) {
      // If we received more than 1 message, there are more messages to be loaded
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
    logger.debug("Messages added:", unique.length, ", oldest", this.getOldestMessage(channel), this.channels[channel].isReady, older, this.channels[channel].messages.length === 0);
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
    // if(!this.socket)
    //   return;
    logger.debug("LOAD POST", hash)
    if(!this.posts[hash]) {
      this.orbit.getPost(hash).then((data) => {
        this.posts[hash] = data;
        callback(null, data);

      })
      // this.orbit.getPost(hash, (err, data) => {
      //   logger.debug("POST LOADED", hash, data)
      // // this.socket.emit('post.get', hash, (err, data) => {
      //   this.posts[hash] = data;
      //   callback(err, data);
      // });
    } else {
      callback(null, this.posts[hash]);
    }
  },
  onSendMessage: function(channel: string, text: string) {
    // if(!this.socket)
    //   return;
    logger.debug("--> send message" + text);
    UIActions.startLoading(channel, "send");
    this.orbit.sendMessage(channel, text, (err) => {
    // this.socket.emit('message.send', channel, text, (err) => {
      if(err) {
        logger.warn("Couldn't send message: " + err.toString());
        UIActions.raiseError(err.toString());
      }
      UIActions.stopLoading(channel, "send");
    });
  },
  onAddFile: function(channel: string, filePath: string, buffer) {
    logger.debug("--> add file: " + filePath + buffer !== null);
    this.orbit.addFile(channel, filePath, buffer);

    if(this.socket) {
      UIActions.startLoading(channel, "file");
      this.socket.emit('file.add', channel, filePath, (err) => {
        if(err) {
          logger.warn("Couldn't add file: " + filePath + " - " + err.toString());
          UIActions.raiseError(err.toString());
        }
        UIActions.stopLoading(channel, "file");
      });
    }
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

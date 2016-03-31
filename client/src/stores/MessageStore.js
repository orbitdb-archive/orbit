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
    this.hasLoaded = false;
    this.loading = false;
    this.canLoadMore = true;
  },
  getMessages: function(channel: string) {
    if(!this.messages[channel])
      this.loadMessages(channel, null, null, messagesBatchSize);

    return this.messages[channel] ? this.messages[channel] : [];
  },
  getOldestMessage: function(channel: string) {
    return this.messages[channel] && this.messages[channel].length > 0 ? this.messages[channel][0].key : null;
  },
  onSocketConnected: function(socket) {
    console.log("MessageStore connected");
    this.socket = socket;

    // Handle new messages
    this.socket.on('messages', (channel, message) => {
      console.log("--> new messages in #", channel, message);
      this.loadMessages(channel, null, null, messagesBatchSize);
    });

    // Handle DB loading state
    this.socket.on('db.load', (action, channel) => {
      if(action === 'sync') {
        this.hasLoaded = false;
        UIActions.startLoading(channel, "loadhistory", "Syncing...");
      }
      else if(action === 'query')
        UIActions.startLoading(channel, "query", "Loading...");
    });
    this.socket.on('db.loaded', (action, channel) => {
      if(action === 'sync') {
        this.hasLoaded = true;
        UIActions.stopLoading(channel, "loadhistory");
      }
      else if(action === 'query')
        UIActions.stopLoading(channel, "query");
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
    // console.log("MessageStore - open #" + channel);
    if(!this.messages[channel]) this.messages[channel] = [];
    this._resetLoadingState();
  },
  onLeaveChannel: function(channel: string) {
    // console.log("MessageStore - close #" + channel);
    this._resetLoadingState();
    delete this.messages[channel];
  },
  onShowChannel: function(channel: string) {
    if(!this.messages[channel]) this.messages[channel] = [];
    this._resetLoadingState();
  },
  onLoadMoreMessages: function(channel: string) {
    if(!this.loading && this.canLoadMore) {
      console.log("MessageStore - load more messages from #" + channel);
      this.canLoadMore = false;
      this.loadMessages(channel, this.getOldestMessage(channel), null, messagesBatchSize);
    }
  },
  loadMessages: function(channel: string, olderThanHash: string, newerThanHash: string, amount: number) {
    if(!this.socket)
      return;

    console.log("--> channel.get: ", channel, olderThanHash, newerThanHash, amount);
    this.loading = true;
    UIActions.startLoading(channel, "loadmessages", "Loading messages...");
    this.socket.emit('channel.get', channel, olderThanHash, newerThanHash, amount, (c, messages) => {
      this._addMessages(channel, messages, olderThanHash !== null);
      this.loading = false;
      UIActions.stopLoading(channel, "loadmessages");
    });
  },
  _addMessages: function(channel: string, newMessages: Array, older: boolean) {
    console.log("<-- messages: ", channel, newMessages.length, newMessages);
    var unique = _.differenceWith(newMessages, this.messages[channel], _.isEqual);
    console.log("MessageStore - new messages count: ", unique.length);

    if(unique.length > 0) {
      // If we received more than 1 message, there are more messages to be loaded
      // if(unique.length > 1) {
      //   this.canLoadMore = true;
      // } else if(unique.length === 1 && this.messages[channel].length === 0 && older) {
      //   // Special case for a channel that has only one message
      //   ChannelActions.reachedChannelStart();
      // }
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
    console.log("--> send message:", text);
    UIActions.startLoading(channel, "send");
    this.socket.emit('message.send', channel, text, (err) => {
      if(err) {
        console.log("Couldn't send message:", err.toString());
        UIActions.raiseError(err.toString());
      }
      UIActions.stopLoading(channel, "send");
    });
  },
  onAddFile: function(channel: string, filePath: string) {
    console.log("--> add file:", filePath);
    UIActions.startLoading(channel);
    this.socket.emit('file.add', channel, filePath, (err) => {
      if(err) {
        console.log("Couldn't add file:", filePath, err.toString());
        UIActions.raiseError(err.toString());
      }
      UIActions.stopLoading(channel);
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

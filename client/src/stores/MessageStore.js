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

const messagesBatchSize = 4;

const MessageStore = Reflux.createStore({
  listenables: [AppActions, UIActions, NetworkActions, SocketActions, ChannelActions],
  init: function() {
    this.currentChannel = null;
    this.channels = {};
    this.posts = {}; // simple cache for message contents
    this.feedStream = null
    this._reset();

    this.loading = false;

    // debug for Friedel
    window.send = (amount, interval) => {
      let i = 0;
      let timer = setInterval(() => {
        this.onSendMessage(this.currentChannel, "hello " + i);
        i ++;
        if(i === amount) clearInterval(timer);
      }, interval);
    };
  },
  onSetFeedStreamDatabase: function(db) {
    this.feedStream = db
  },
  onInitialize: function(orbit) {
    this.orbit = orbit

    this.orbit.events.on('message', (channel, message) => {
      // logger.info("-->", channel, message)
      // this.loadMessages(channel, null, null, messagesBatchSize);
      this._addMessages(channel, [message], false)
    })

    this.orbit.events.on('joined', (channel) => {
      logger.info(`Joined #${channel}`);
      const feed = this.orbit.channels[channel].feed;
      // feed.events.on('write', (name, newItems) => {
      //   logger.info("New messages in #" + channel);
      //   // this.loadMessages(channel, null, null, messagesBatchSize);
      //   this._addMessages(name, newItems, false)
      // });

      // feed.events.on('data', (name, hash) => {
      //   // logger.info("Sent message to #" + channel);
      //   logger.info("New messages in #" + channel);
      //   this.loadMessages(channel, null, null, messagesBatchSize);
      // });

      feed.events.on('history', (name, messages) => {
        // console.log("-------------------------------- HISTORY", name, messages)
        if(messages[0] && messages[0].next.length > 0)
          this.channels[channel].canLoadMore = true;
        this._addMessages(channel, _.take(messages.reverse(), messagesBatchSize - 1), true)
      });

      feed.events.on('sync', (name) => {
        // TODO: started loading new items
        // console.log("-------------------------------- SYNC")
        // logger.debug("Syncing");
        // UIActions.startLoading(channel.name, "sync", "Syncing...");
        // if(this.syncTimeout[channel.name]) clearTimeout(this.syncTimeout[channel.name])
        // this.syncTimeout[channel.name] = setTimeout(() => {
        //   const text = `Syncing is taking a long time. This usually means connection problems with the network.`
        //   UIActions.startLoading(channel.name, "synctimeout", text)
        // }, 10000)

        // setTimeout(() => {
        //   logger.debug("Clear")
        //   clearTimeout(this.syncTimeout[channel.name])
        //   delete this.syncTimeout[channel.name]
        //   UIActions.stopLoading(channel.name, "sync")
        //   UIActions.stopLoading(channel.name, "synctimeout")
        // }, 60000)

      });

      feed.events.on('load', (name, hash) => {
        // TODO: started loading feed's history
        console.log("-------------------------------- LOAD", name, hash)
        UIActions.startLoading(name, "loadHistory", "Loading history...");
        if(this.connectTimeout[name]) clearTimeout(this.connectTimeout[name]);
        this.connectTimeout[name] = setTimeout(() => {
          const text = `Loading history for #${name} is taking a long time. This usually means connection problems with the network.`
          UIActions.startLoading(name, "loadHistory", text);
        }, 10000);
      });

      feed.events.on('ready', (name) => {
        // TODO: feed's history loaded
        console.log("-------------------------------- READY", name)
        clearTimeout(this.connectTimeout[name]);
        delete this.connectTimeout[name];
        UIActions.stopLoading(name, "loadHistory");
        if(this.channels[name]) this.channels[name].canLoadMore = true;
      });
    })
  },
  // _updateLoadingState: function(channel) {
  //   logger.debug("Update channel state", channel);
  //   if(channel) {
  //     this.channels[channel.name].isReady = !channel.state.loading && !channel.state.syncing;
  //     this.channels[channel.name].loading = channel.state.loading;
  //     this.channels[channel.name].syncing = channel.state.syncing;

  //     if(channel.state.loading) {
  //       UIActions.startLoading(channel.name, "loadhistory", "Connecting...");
  //       if(this.connectTimeout[channel.name]) clearTimeout(this.connectTimeout[channel.name]);
  //       this.connectTimeout[channel.name] = setTimeout(() => {
  //         UIActions.startLoading(channel.name, "loadhistory", `Connecting to the channel is taking a long time. This usually means connection problems with the network.`);
  //       }, 10000);
  //     } else {
  //       clearTimeout(this.connectTimeout[channel.name]);
  //       delete this.connectTimeout[channel.name];
  //       UIActions.stopLoading(channel.name, "loadhistory");
  //     }

  //     if(channel.state.syncing > 0 && !this.syncTimeout[channel.name]) {
  //       logger.debug("Syncing");
  //       UIActions.startLoading(channel.name, "sync", "Syncing...");
  //       if(this.syncTimeout[channel.name]) clearTimeout(this.syncTimeout[channel.name]);
  //       this.syncTimeout[channel.name] = setTimeout(() => {
  //         UIActions.startLoading(channel.name, "synctimeout", "Syncing is taking a long time. This usually means connection problems with the network.");
  //       }, 10000);
  //     } else {
  //       logger.debug("Clear");
  //       clearTimeout(this.syncTimeout[channel.name]);
  //       delete this.syncTimeout[channel.name];
  //       UIActions.stopLoading(channel.name, "sync");
  //       UIActions.stopLoading(channel.name, "synctimeout");
  //     }
  //   }
  // },
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
    // return this.channels[channel] && this.channels[channel].messages.length > 0 ? this.channels[channel].messages[0].hash : null;
    return this.channels[channel] && this.channels[channel].messages.length > 0 ? this.channels[channel].messages[this.channels[channel].messages.length - 1].hash : null;
  },
  onDisconnect: function() {
    this._reset();
  },
  onJoinChannel: function(channel, password) {
    // console.log("JOIN", channel)
    this._resetChannelState(this.currentChannel);
    if(!this.channels[channel])
      this.channels[channel] = { messages: [], isReady: false, loading: false, canLoadMore: true, new: false, ready: false };
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
  reachedChannelStart: function(channel: string) {
    if (this.channels[channel]) this.channels[channel].new = true
  },
  onLoadMessages: function(channel: string) {
    // console.log("onLoadMessages", channel)
    if (this.channels[channel])
      this.trigger(channel, this.channels[channel].messages);
  },
  onLoadMoreMessages: function(channel: string) {
    console.log(this.loading, this.channels[channel].canLoadMore, channel, this.currentChannel)

    if (channel !== this.currentChannel)
      return;

    // if(!this.channels[channel].loading && this.channels[channel].canLoadMore) {
      if (!this.loading && this.channels[channel].canLoadMore) {
        logger.debug("load more messages from #" + channel);
        // this.channels[channel].canLoadMore = true;
        this.loadMessages(channel, this.getOldestMessage(channel), null, messagesBatchSize);
      }
    // }
  },
  loadMessages: function(channel: string, olderThanHash: string, newerThanHash: string, amount: number) {
    logger.debug("--> GET MESSAGES #" + channel + ", " + olderThanHash + " " + newerThanHash  + " " + amount);
    // this.channels[channel].loading = true;
      this.loading = true
    UIActions.startLoading(channel, "loadMessages", "Loading more messages...");
    this.orbit.get(channel, olderThanHash, newerThanHash, amount)
      .then((messages) => {
        this._addMessages(channel, messages, olderThanHash !== null);
        this.loading = false
        UIActions.stopLoading(channel, "loadMessages");
        // this.channels[channel].loading = false;
      })
      .catch((e) => {
        console.error(e)
        this.loading = false
      })
  },
  _addMessages: function(channel: string, newMessages: Array, older: boolean) {
    logger.debug("<-- Add " + newMessages.length + " messages to #" + channel);
    console.log(newMessages);
    var unique = _.differenceWith(newMessages, this.channels[channel].messages, _.isEqual);
    logger.debug("Unique new messages: " + unique.length);

    if (unique.length > 0) {
      // If we received more than 1 message, there are more messages to be loaded
      this.channels[channel].canLoadMore = true;
      if(unique.length === 1 && this.channels[channel].messages.length === 0 && older) {
        // Special case for a channel that has only one message
        ChannelActions.reachedChannelStart(channel);
      }

      // Append the new messages either at the end (newer) or at the beginning (older)
      if (older)
        this.channels[channel].messages = unique.concat(this.channels[channel].messages);
      else
        this.channels[channel].messages = this.channels[channel].messages.concat(unique);

      // Load message content
      unique.reverse().forEach((f) => this._loadPost(channel, f.payload));

      // Sort by timestamp
      this.channels[channel].messages = _.orderBy(this.channels[channel].messages, (e) => e.payload.meta.ts, ['desc']);

      NotificationActions.newMessage(channel);
      this.trigger(channel, this.channels[channel].messages);
    } else if (older) {
      this.channels[channel].canLoadMore = false;
      ChannelActions.reachedChannelStart(channel);
    } else if (!older && this.channels[channel].messages.length === 0) {
      this.channels[channel].canLoadMore = false;
      ChannelActions.reachedChannelStart(channel);
    }
    // logger.debug("Messages added:", unique.length, ", oldest", this.getOldestMessage(channel), this.channels[channel].isReady, older, this.channels[channel].messages.length === 0);
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
      if (post && post.content) {
        if (hasMentions(post.content.toLowerCase(), UserStore.user.name.toLowerCase()))
          NotificationActions.mention(channel, post.content);
      }
    });
  },
  onLoadPost: function(hash: string, callback) {
    // TODO: change to Promise instead of callback
    var self = this

    if(!this.posts[hash]) {
      this.orbit.getPost(hash)
        .then((post) => {
          this.posts[hash] = post;
          const replyToHash = post.replyto
          // console.log("1", replyToHash, post)
          if(replyToHash) {
            const cached = this.posts[replyToHash]
          // console.log("2", cached)
            if(cached && cached.content) {
              this.orbit.getUser(cached.meta.from).then((user) => {
                let content = ''
                if(cached.meta.type === 'text')
                  content = cached.content
                else
                  content = cached.name

                // console.log("--2", content)
                // self.posts[hash].replyToContent = "<" + user.name + "> " + content;
                self.posts[hash].replyToContent = {
                  user: user,
                  post: cached,
                }
                callback(null, self.posts[hash]);
              })
            } else {
          // console.log("3")
              this.onLoadPost(replyToHash, (err, data) => {
          // console.log("4", data)
                if(data) {
                  this.orbit.getUser(data.meta.from).then((user) => {
                    let content = ''
                    if(data.meta.type === 'text')
                      content = data.content
                    else
                      content = data.name

                    console.log("--1", content)
                    self.posts[replyToHash] = data;
                    // self.posts[hash].replyToContent = "<" + user.name + "> " + content;
                    self.posts[hash].replyToContent = {
                      user: user,
                      post: data,
                    }
                    callback(null, self.posts[hash]);
                  })
                }
              })
            }
          } else {
            callback(null, post);
          }
        })
        .catch((e) => logger.error(e))
    } else {
      callback(null, this.posts[hash]);
    }
  },
  onSendMessage: function(channel: string, text: string, replyToHash: string) {
    logger.debug("--> Send message: " + text, replyToHash);
    // UIActions.startLoading(channel, "send");
    this.orbit.send("--planet-express." + this.orbit.user.id, text, replyToHash)
    // this.orbit.send(channel, text, replyToHash)
      .then((post) => {
        logger.debug("Sent:", post.content)
        // logger.debug(post)
        // UIActions.stopLoading(channel, "send");
      })
      .catch((e) => console.error(e))
  },
  onAddFile: function(channel: string, filePath: string, buffer, meta) {
    logger.debug("--> Add file: " + filePath + buffer !== null);
    UIActions.startLoading(channel, "file");
    this.orbit.addFile(channel, filePath, buffer, meta)
      .then((post) => UIActions.stopLoading(channel, "file"))
      .catch((e) => {
        const error = e.toString();
        logger.error(`Couldn't add file: ${JSON.stringify(filePath)} -  ${error}`);
        UIActions.raiseError(error);
      })
  },
  onLoadFile: function(hash: string, asURL: boolean, asStream: boolean, callback) {
    const isElectron = !!window.ipfsInstance;
    if(isElectron && asURL) {
      callback(null, null, `http://localhost:8080/ipfs/${hash}`)
    } else if(isElectron) {
      var xhr = new XMLHttpRequest()
      xhr.open('GET', `http://localhost:8080/ipfs/${hash}`, true)
      xhr.withCredentials = true
      xhr.responseType = 'blob'
      xhr.onload = function(e) {
        if(this.status == 200) {
          callback(null, this.response) // this.response is a Blob
        }
      }
      xhr.send()
    } else {
      this.orbit.getFile(hash)
        .then((stream) => {
          if(asStream) {
            callback(null, null, null, stream)
          } else {
            let buf = new Uint8Array(0)
            stream.on('error', () => callback(err, null));
            stream.on('data', (chunk) => {
              const tmp = new Uint8Array(buf.length + chunk.length)
              tmp.set(buf)
              tmp.set(chunk, buf.length)
              buf = tmp
            });
            stream.on('end', () => {
              callback(null, buf)
            });
          }
        })
        .catch((e) => logger.error(e))
    }
  },
  onLoadDirectoryInfo: function(hash, callback) {
    // TODO: refactor
    this.orbit.getDirectory(hash)
      .then((result) => {
        // console.log("DIRECTORY", result)
        result = result.map((e) => {
          return {
            hash: e.Hash,
            size: e.Size,
            type: e.Type === 1 ? "directory" : "file",
            name: e.Name
          };
        });
        // console.log("DIRECTORY2", result)
        callback(null, result)
      })
  }
});

export default MessageStore;

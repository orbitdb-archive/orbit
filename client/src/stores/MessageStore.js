'use strict'

import sortBy from 'lodash.sortby'
import take from 'lodash.take'
import differenceWith from 'lodash.differencewith'
import Reflux from 'reflux'
import AppActions from 'actions/AppActions'
import UIActions from 'actions/UIActions'
import NetworkActions from 'actions/NetworkActions'
import ChannelActions from 'actions/ChannelActions'
import NotificationActions from 'actions/NotificationActions'
import UserActions from 'actions/UserActions'
import UserStore from 'stores/UserStore'
import Logger from 'logplease'

const logger = Logger.create('MessageStore', { color: Logger.Colors.Magenta })

const messagesBatchSize = 8

const MessageStore = Reflux.createStore({
  listenables: [AppActions, UIActions, NetworkActions, ChannelActions],
  init: function() {
    this.currentChannel = null
    this.channels = {}
    this.posts = {} // simple cache for message contents
    this.orbit = null
    this._reset()

    this.loading = false

    // debug for Friedel
    window.send = (amount, interval) => {
      let i = 0
      let timer = setInterval(() => {
        this.onSendMessage(this.currentChannel, "hello " + i)
        i ++
        if(i === amount) clearInterval(timer)
      }, interval)
    }
  },
  _add(channel, messages) {
    messages = messages || []
    let uniqueNew = differenceWith(messages, this.channels[channel].messages, (a, b) => a.hash === b.hash && a.meta.ts === b.meta.ts)

    // Process all new messages
    uniqueNew.forEach((post) => {
      // Add users to the known users list
      UserActions.addUser(post.meta.from)
      // Fire notifications
      NotificationActions.newMessage(channel, post)
    })

    this.channels[channel].messages = this.channels[channel].messages.concat(uniqueNew)
    this.channels[channel].messages = sortBy(this.channels[channel].messages, (e) => e.meta.ts)
    this.trigger(channel, this.channels[channel].messages)
  },
  onInitialize: function(orbit) {
    this.orbit = orbit

    this.orbit.events.on('message', (channel, message) => {
      // logger.info("-->", channel, message)
      setImmediate(() => this._add(channel, [message]))
    })

    this.orbit.events.on('history', (channel, messages) => {
      // logger.info("-->", channel, message)
      // setImmediate(() => this._add(channel, [message]))
      UIActions.stopLoading(channel, "load")
    })

    this.loadingCount = 0

    this.orbit.events.on('joined', (channel) => {
      logger.info(`Joined #${channel}`)
      const feed = this.orbit.channels[channel].feed

      feed.events.on('history', (name, messages) => {
        UIActions.startLoading(name, "load")
        // this.orbit.get(name, null, null, messages.length)
        //   .then((posts) => {
        //     this._add(channel, posts)
        //     UIActions.stopLoading(name, "loadHistory")
        //   })
      })

      feed.events.on('load.start', (name, amount) => {
        this.loadingCount = amount
        UIActions.startLoading(name, "load")
      })
      feed.events.on('load.progress', (name, amount) => {
        // console.log("Loading: ", this.loadingCount--)
      })
      feed.events.on('load.end', (name, amount) => {
        this.loadingCount = 0
        UIActions.stopLoading(name, "load")
      })

      feed.events.on('load', (name, hash) => {
        if (hash) {
          // UIActions.startLoading(name, "loadHistory", "Loading history...")
          if(this.connectTimeout[name]) clearTimeout(this.connectTimeout[name])          
        }
      })

      feed.events.on('ready', (name) => {
        clearTimeout(this.connectTimeout[name])
        delete this.connectTimeout[name]
        // UIActions.stopLoading(name, "loadHistory")
        this.channels[name].canLoadMore = true
      })
    })
  },
  _reset: function() {
    this.channels = {}
    this.posts = {}
    this.currentChannel = null
    this.syncTimeout = {}
    this.connectTimeout = {}
  },
  _resetChannelState: function(channel) {
    if(this.syncTimeout[channel]) clearTimeout(this.syncTimeout[channel])
    if(this.connectTimeout[channel]) clearTimeout(this.connectTimeout[channel])
    delete this.syncTimeout[channel]
    delete this.connectTimeout[channel]
    if(channel) {
      this.channels[channel].isReady = false
      this.channels[channel].loading = false
      this.channels[channel].canLoadMore = true
    }
  },
  getOldestMessage: function(channel: string) {
    return this.channels[channel] && this.channels[channel].messages.length > 0 ? this.channels[channel].messages[0].hash : null
  },
  onDisconnect: function() {
    this._reset()
  },
  onJoinChannel: function(channel, password) {
    this._resetChannelState(this.currentChannel)
    if(!this.channels[channel])
      this.channels[channel] = { messages: [], isReady: false, loading: false, canLoadMore: true }
    this.currentChannel = channel
  },
  onLeaveChannel: function(channel: string) {
    this._resetChannelState(channel)
  },
  onLoadMessages: function(channel: string) {
    if(this.channels[channel])
      this.trigger(channel, this.channels[channel].messages)
  },
  onLoadMoreMessages: function(channel: string) {
    if(channel !== this.currentChannel)
      return

    if(!this.loading && this.channels[channel].canLoadMore) {
      logger.debug("load more messages from #" + channel)
      this.loadMessages(channel, this.getOldestMessage(channel), null, messagesBatchSize)
    }
  },
  loadMessages: function(channel: string, olderThanHash: string, newerThanHash: string, amount: number) {
    // logger.debug("--> GET MESSAGES #" + channel + ", " + olderThanHash + " " + newerThanHash  + " " + amount)
    // this.loading = true
    this.orbit.get(channel, olderThanHash, newerThanHash, amount)
      .then((messages) => {
        // this._add(messages)
        // this._addMessages(channel, messages, olderThanHash !== null)
        // this.loading = false
      })
  },
  _addMessages: function(channel: string, newMessages: Array, older: boolean) {
    logger.debug("<-- Add " + newMessages.length + " messages to #" + channel)
    // console.log(newMessages)
    // console.log(this.channels[channel].messages)
    var unique = differenceWith(newMessages, this.channels[channel].messages, (a, b) => a.hash === b.hash)
    logger.debug("Unique new messages: " + unique.length)

    if(unique.length > 0) {
      // If we received more than 1 message, there are more messages to be loaded
      this.channels[channel].canLoadMore = true
      if(unique.length === 1 && this.channels[channel].messages.length === 0 && older) {
        // Special case for a channel that has only one message
        ChannelActions.reachedChannelStart()
      }

      // Append the new messages either at the end (newer) or at the beginning (older)
      if(older)
        this.channels[channel].messages = unique.concat(this.channels[channel].messages)
      else
        this.channels[channel].messages = this.channels[channel].messages.concat(unique)

      // Load message content
      unique.reverse().forEach((f) => this._loadPost(channel, f.payload))

      // Sort by timestamp
      this.channels[channel].messages = sortBy(this.channels[channel].messages, (e) => e.payload.meta.ts)

      NotificationActions.newMessage(channel)
      this.trigger(channel, this.channels[channel].messages)
    } else if(older) {
      this.channels[channel].canLoadMore = false
      ChannelActions.reachedChannelStart()
    } else if(!older && this.channels[channel].messages.length === 0) {
      this.channels[channel].canLoadMore = false
      ChannelActions.reachedChannelStart()
    }
  },
  _loadPost: function(channel: string, message) {
    // const hasMentions = (text: string, mention: string) => {
    //   return text.split(' ').map((word) => {
    //       const match = word.startsWith(mention)
    //               || word.startsWith(mention + ":")
    //               || word.startsWith("@" + mention)
    //               || word.startsWith(mention + ",")
    //       return match
    //   }).filter((f) => f === true).length > 0
    // }

    // this.onLoadPost(message.value, (err, post) => {
    //   UserActions.addUser(post.meta.from)
    //   if(post && post.content) {
    //     if(hasMentions(post.content.toLowerCase(), UserStore.user.name.toLowerCase()))
    //       NotificationActions.mention(channel, post.content)
    //   }
    // })
  },
  onLoadPost: function(hash: string, callback) {
    // TODO: change to Promise instead of callback
    var self = this

    if(!this.posts[hash]) {
      this.orbit.getPost(hash)
        .then((post) => {
          this.posts[hash] = post
          const replyToHash = post.replyto
          if(replyToHash) {
            const cached = this.posts[replyToHash]
            if(cached && cached.content) {
              this.orbit.getUser(cached.meta.from).then((user) => {
                let content = ''
                if(cached.meta.type === 'text')
                  content = cached.content
                else
                  content = cached.name

                self.posts[hash].replyToContent = "<" + user.name + "> " + content
                callback(null, self.posts[hash])
              })
            } else {
              this.onLoadPost(replyToHash, (err, data) => {
                if(data) {
                  this.orbit.getUser(data.meta.from).then((user) => {
                    let content = ''
                    if(data.meta.type === 'text')
                      content = data.content
                    else
                      content = data.name

                    self.posts[replyToHash] = data
                    self.posts[hash].replyToContent = "<" + user.name + "> " + content
                    callback(null, self.posts[hash])
                  })
                }
              })
            }
          } else {
            callback(null, post)
          }
        })
        .catch((e) => logger.error(e))
    } else {
      callback(null, this.posts[hash])
    }
  },
  onSendMessage: function(channel: string, text: string, replyToHash: string) {
    logger.debug("--> Send message: ", text, replyToHash)
    this.orbit.send(channel, text, replyToHash)
      .then((post) => {
        logger.debug("Sent:", post.content)
      })
      .catch((e) => console.error(e))
  },
  onAddFile: function(channel: string, filePath: string, buffer, meta) {
    logger.debug("--> Add file: " + filePath + buffer !== null)
    UIActions.startLoading(channel, "file")
    this.orbit.addFile(channel, filePath, buffer, meta)
      .then((post) => UIActions.stopLoading(channel, "file"))
      .catch((e) => {
        const error = e.toString()
        logger.error(`Couldn't add file: ${JSON.stringify(filePath)} -  ${error}`)
        UIActions.raiseError(error)
      })
  },
  onLoadFile: function(hash: string, asURL: boolean, asStream: boolean, callback) {
    const isElectron = window.isElectron
    if(isElectron && asURL) {
      console.log(window.gatewayAddress, this.orbit._ipfs.GatewayAddress)
      callback(null, null, 'http://' + window.gatewayAddress + hash)
    } else if(isElectron) {
      var xhr = new XMLHttpRequest()
      xhr.open('GET', 'http://' + window.gatewayAddress + hash, true)
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
            stream.on('error', () => callback(err, null))
            stream.on('data', (chunk) => {
              const tmp = new Uint8Array(buf.length + chunk.length)
              tmp.set(buf)
              tmp.set(chunk, buf.length)
              buf = tmp
            })
            stream.on('end', () => {
              callback(null, buf)
            })
          }
        })
        .catch((e) => logger.error(e))
    }
  },
  onLoadDirectoryInfo: function(hash, callback) {
    // TODO: refactor
    this.orbit.getDirectory(hash)
      .then((result) => {
        result = result.map((e) => {
          return {
            hash: e.Hash,
            size: e.Size,
            type: e.Type === 1 ? "directory" : "file",
            name: e.Name
          }
        })
        callback(null, result)
      })
  }
})

export default MessageStore

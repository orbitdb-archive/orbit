'use strict'

const path         = require('path')
const EventEmitter = require('events').EventEmitter
const OrbitDB      = require('orbit-db')
const Crypto       = require('orbit-crypto')
const Post         = require('ipfs-post')
const Logger       = require('logplease')
const bs58         = require('bs58')
const logger       = Logger.create("Orbit", { color: Logger.Colors.Green })

const getAppPath = () => process.type && process.env.ENV !== "dev" ? process.resourcesPath + "/app/" : process.cwd()

const defaultOptions = {
  cacheFile: path.join(getAppPath(), "/orbit-data.json"), // path to orbit-db cache file
  maxHistory: 64 // how many messages to retrieve from history on joining a channel
}

let signKey

class Orbit {
  constructor(ipfs, options) {
    this.events = new EventEmitter()
    this._ipfs = ipfs
    this._orbitdb = null
    this._user = null
    this._channels = {}
    this._peers = []
    this._options = defaultOptions
    this._pollPeersTimer = null
    Object.assign(this._options, options)
  }

  /* Properties */

  get user() {
    return this._user
  }

  get network() {
    return this._orbitdb ? this._orbitdb.network : null
  }

  get channels() {
    return this._channels
  }

  get peers() {
    return this._peers
  }

  /* Public methods */

  connect(host, username, password) {
    logger.debug("Load cache from:", this._options.cacheFile)
    logger.info(`Connecting to network '${host}' as '${username}`)

    return OrbitDB.connect(host, username, password, this._ipfs)
      .then((orbitdb) => {
        this._orbitdb = orbitdb
        this._user = orbitdb.user
        this._orbitdb.events.on('data', this._handleMessage.bind(this)) // Subscribe to updates in the database
        this._startPollingForPeers() // Get peers from libp2p and update the local peers array
      })
      .then(() => Crypto.generateKey())
      .then((key) => this._user.signKey = key)
      .then(() => {
        logger.info(`Connected to '${this._orbitdb.network.name}' at '${this._orbitdb.network.publishers[0]}' as '${this.user.username}`)
        this.events.emit('connected', this.network, this.user)
        return this
      })
  }

  disconnect() {
    if(this._orbitdb) {
      logger.warn(`Disconnected from '${this.network.name}' at '${this.network.publishers[0]}'`)
      this._orbitdb.disconnect()
      this._orbitdb = null
      this._user = null
      this._channels = {}
      if(this._pollPeersTimer) clearInterval(this._pollPeersTimer)
      this.events.emit('disconnected')
    }
  }

  join(channel) {
    logger.debug(`Join #${channel}`)

    if(!channel || channel === '')
      return Promise.reject(`Channel not specified`)

    if(this._channels[channel])
      return Promise.resolve(false)

    const dbOptions = {
      cacheFile: '/' + this.user.id + this._options.cacheFile,
      maxHistory: this._options.maxHistory
    }

    this._channels[channel] = {
      name: channel,
      password: null,
      feed: this._orbitdb.eventlog(channel, dbOptions) // feed is the database instance
    }

    this.events.emit('joined', channel)
    return Promise.resolve(true)
  }

  leave(channel) {
    if(this._channels[channel]) {
      this._channels[channel].feed.close()
      delete this._channels[channel]
      logger.debug("Left channel #" + channel)
    }
    this.events.emit('left', channel)
  }

  send(channel, message) {
    logger.debug(`Send message to #${channel}: ${message}`)

    if(!message || message === '')
      return Promise.reject(`Can't send an empty message`)

    const data = {
      content: message,
      from: this._orbitdb.user.id
    }

    return this._getChannelFeed(channel)
      .then((feed) => this._postMessage(feed, Post.Types.Message, data, this.user.signKey))
  }

  get(channel, lessThanHash, greaterThanHash, amount) {
    logger.debug(`Get messages from #${channel}: ${lessThanHash}, ${greaterThanHash}, ${amount}`)

    let options = {
      limit: amount || 1,
      lt: lessThanHash || null,
      gte: greaterThanHash || null
    }

    return this._getChannelFeed(channel)
      .then((feed) => feed.iterator(options).collect())
  }

  getPost(hash) {
    // TODO:
    // return this._ipfs.object.get(hash, { enc: 'base58' })
    //   .then((res) => post = Post.fromDAGNode(res))
    //   .then(() => Crypto.importKeyFromIpfs(this._ipfs, post.signKey))
    //   .then((key) => Post.verify(post, key))
    //   .then(() => post)
    let post, signKey
    return this._ipfs.object.get(hash, { enc: 'base58' })
      .then((res) => post = JSON.parse(res.toJSON().Data))
      .then(() => Crypto.importKeyFromIpfs(this._ipfs, post.signKey))
      .then((signKey) => Crypto.verify(
        new Uint8Array(post.sig),
        signKey,
        new Buffer(JSON.stringify({
          content: post.content,
          meta: post.meta,
          replyto: post.replyto
        })))
       )
      .then(() => post)
  }

  /*
    addFile(channel, source) where source is:
    {
      // for all files, filename must be specified
      filename: <filepath>,    // add an individual file
      // and optionally use one of these in addition
      directory: <path>,       // add a directory
      buffer: <Buffer>,        // add a file from buffer
      // optional meta data
      meta: <meta data object>
    }
  */
  addFile(channel, source) {
    if(!source || (!source.filename && !source.directory))
      return Promise.reject(`Filename or directory not specified`)

    const addToIpfsJs = (ipfs, data) => {
      return ipfs.files.add(new Buffer(data))
        .then((result) => {
          return {
            Hash: bs58.encode(result[0].node.multihash()).toString(),
            isDirectory: false
          }
        })
    }

    const addToIpfsGo = (ipfs, filename, filePath) => {
      return ipfs.add(filePath, { recursive: true })
        .then((result) => {
          // last added hash is the filename --> we added a directory
          // first added hash is the filename --> we added a file
          const isDirectory = result[result.length - 1].Name === filename
          return {
            Hash: isDirectory ? result[result.length - 1].Hash : result[0].Hash,
            isDirectory: isDirectory
          }
        })
    }

    logger.info("Adding file from path '" + source.filename + "'")

    const isBuffer = (source.buffer && source.filename) ? true : false
    const name = source.directory ? source.directory.split("/").pop() : source.filename.split("/").pop()
    const size = (source.meta && source.meta.size) ? source.meta.size : 0

    let feed, addToIpfs

    if(isBuffer) // Adding from browsers
      addToIpfs = () => addToIpfsJs(this._ipfs, source.buffer)
    else if(source.directory) // Adding from Electron
      addToIpfs = () => addToIpfsGo(this._ipfs, name, source.directory)
    else
      addToIpfs = () => addToIpfsGo(this._ipfs, name, source.filename)

    return this._getChannelFeed(channel)
      .then((res) => feed = res)
      .then(() => addToIpfs())
      .then((result) => {
        logger.info("Added file '" + source.filename + "' as ", result)
        // Create a post
        const type = result.isDirectory ? Post.Types.Directory : Post.Types.File
        const data = {
          name: name,
          hash: result.Hash,
          size: size,
          from: this.user.id,
          meta: source.meta || {}
        }
        return this._postMessage(feed, type, data, this.user.signKey)
      })
  }

  getFile(hash) {
    return this._ipfs.cat(hash)
  }

  getDirectory(hash) {
    return this._ipfs.ls(hash).then((res) => res.Objects[0].Links)
  }

  /* Private methods */

  _postMessage(feed, postType, data, signKey) {
    let post
    return Post.create(this._ipfs, postType, data, signKey)
      .then((res) => post = res)
      .then(() => feed.add(post.Hash))
      .then(() => post)
  }

  _getChannelFeed(channel) {
    if(!channel || channel === '')
      return Promise.reject(`Channel not specified`)

    return new Promise((resolve, reject) => {
      const feed = this._channels[channel] && this._channels[channel].feed ? this._channels[channel].feed : null
      if(!feed) reject(`Haven't joined #${channel}`)
      resolve(feed)
    })
  }

  // TODO: tests for everything below
  _handleError(e) {
    logger.error(e)
    logger.error("Stack trace:\n", e.stack)
    this.events.emit('error', e.message)
    throw e
  }

  _handleMessage(channel, message) {
    // logger.debug("new messages in ", channel, message)
    if(this._channels[channel])
      this.events.emit('message', channel, message)
  }

  _startPollingForPeers() {
    this._pollPeersTimer = setInterval(() => {
      this._updateSwarmPeers().then((peers) => {
        this._peers = peers
        this.events.emit('peers', this._peers)
      })
    }, 1000)
  }

  _updateSwarmPeers() {
    if(this._ipfs.libp2p && this._ipfs.libp2p.swarm.peers) {
      // js-_ipfs
      return new Promise((resolve, reject) => {
        this._ipfs.libp2p.swarm.peers((err, peers) => {
          if(err) reject(err)
          resolve(peers)
        })
      })
      .then((peers) => Object.keys(peers).map((e) => peers[e].multiaddrs[0].toString()))
    } else {
      // js-_ipfs-api
      return new Promise((resolve, reject) => {
        return this._ipfs.swarm.peers((err, res) => {
          if(err) reject(err)
          resolve(res)
        })
      })
      .then((peers) => peers.Strings)
    }
  }

}

module.exports = Orbit

'use strict'

const path         = require('path')
const EventEmitter = require('events').EventEmitter
const OrbitDB      = require('orbit-db')
const Post         = require('ipfs-post')
const Logger       = require('logplease')
const logger       = Logger.create("Orbit", { color: Logger.Colors.Green })
const bs58         = require('bs58')

// TODO: move utils to the main process in Electron version so that fs can be used
const utils = require('./utils')

const defaultOptions = {
  cacheFile: path.join(utils.getAppPath(), "/orbit-data.json"), // path to orbit-db cache file
  maxHistory: 64 // how many messages to retrieve from history on joining a channel
}

const Crypto = require('orbit-crypto')
let signKey

class Orbit {
  constructor(ipfs, options) {
    this.events = new EventEmitter();
    this._ipfs = ipfs;
    this._orbitdb = null;
    this._channels = {};
    this._peers = [];
    this._options = defaultOptions;
    Object.assign(this._options, options);
  }

  /* Properties */

  get user() {
    return this._orbitdb ? this._orbitdb.user : null;
  }

  get network() {
    return this._orbitdb ? this._orbitdb.network : null;
  }

  get channels() {
    return this._channels;//Object.keys(this._channels).map((f) => this._channels[f]);
  }

  get peers() {
    return this._peers;
  }

  /* Public methods */

  connect(host, username, password) {
    const user = { username: username, password: password };
    logger.debug("Load cache from:", this._options.cacheFile);
    logger.info(`Connecting to network '${host}' as '${username}`);

    return OrbitDB.connect(host, user.username, user.password, this._ipfs)
      .then((orbitdb) => {
        this._orbitdb = orbitdb;

        // Subscribe to database events
        // this._orbitdb.events.on('data', this._handleMessage2.bind(this));
        // this._orbitdb.events.on('write', this._handleMessage.bind(this));
        this._orbitdb.events.on('data', this._handleMessage.bind(this));
        // this._orbitdb.events.on('load', this._handleStartLoading.bind(this));
        // this._orbitdb.events.on('ready', this._handleDatabaseReady.bind(this));
        // this._orbitdb.events.on('sync', this._handleSync.bind(this));
        // this._orbitdb.events.on('synced', this._handleSynced.bind(this));

        // Get peers from libp2p and update the local peers array
        setInterval(() => {
          this._updateSwarmPeers().then((peers) => {
            this._peers = peers;
            this.events.emit('peers', this._peers);
          });
        }, 1000);
      })
      .then(() => Crypto.generateKey())
      .then((key) => signKey = key)
      .then(() => {
        logger.info(`Connected to '${this._orbitdb.network.name}' at '${this._orbitdb.network.publishers[0]}' as '${user.username}`)
        this.events.emit('connected', this.network, this.user);
        return this;
      })
  }

  disconnect() {
    if(this._orbitdb) {
      logger.warn(`Disconnected from '${this._orbitdb.network.name}' at '${this._orbitdb.network.publishers[0]}'`);
      this._orbitdb.disconnect();
      this._orbitdb = null;
      this._channels = {};
      this.events.emit('disconnected');
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
      // feed is the database instance
      feed: this._orbitdb.eventlog(channel, dbOptions),
      state: { loading: true, syncing: 0 }
    }

    this.events.emit('joined', channel)
    return Promise.resolve(true)
  }

  leave(channel) {
    if(this._channels[channel]) {
      this._channels[channel].feed.close();
      delete this._channels[channel];
      logger.debug("Left channel #" + channel);
    }
    this.events.emit('left', channel);
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
      .then((feed) => this._postMessage(feed, Post.Types.Message, data))
  }

  get(channel, lessThanHash, greaterThanHash, amount) {
    logger.debug(`Get messages from #${channel}: ${lessThanHash}, ${greaterThanHash}, ${amount}`)

    let options = {
      limit: amount || 1,
      lt: lessThanHash || null,
      gte: greaterThanHash || null
    };

    return this._getChannelFeed(channel)
      .then((feed) => feed.iterator(options).collect())
  }

  getPost(hash) {
    let data, signKey
    return this._ipfs.object.get(hash, { enc: 'base58' })
      .then((res) => data = JSON.parse(res.toJSON().Data))
      .then(() => Crypto.importKeyFromIpfs(this._ipfs, data.signKey))
      .then((signKey) => Crypto.verify(
        new Uint8Array(data.sig),
        signKey,
        new Buffer(JSON.stringify({
          content: data.content,
          meta: data.meta,
          replyto: data.replyto
        })))
       )
      // .catch((e) => data)
      .then(() => data)
  }

  // _verifyPost(postData) {
  // }

  /*
    addFile(channel, source) where source:
    {
      // for all files, filename must be specified
      filename: <filepath>,    // add an individual file
      // use either of these
      directory: <path>,       // add a directory
      buffer: <Buffer>,        // add a file from buffer
      // optional meta data
      meta: <meta data object>
    }
  */
  addFile(channel, source) {
    if(!source || !source.filename)
      return Promise.reject(`Filename not specified`)

    const addToIpfsJs = (ipfs, filename, buffer) => {
      // TODO: refactor this when js-ipfs returns { Hash, Name, Size} objects instead of DAGNodes
      return new Promise((resolve, reject) => {
        const data = new Buffer(buffer)
        ipfs.files.add(data).then((result) => {
          // console.log("hash", result, filename)
          // console.log("ADDED A FILE")
          resolve({ Hash: bs58.encode(result[0].node.multihash()).toString(), isDirectory: false })
        })
      })
    }

    const addToIpfsGo = (ipfs, filePath) => {
      return new Promise((resolve, reject) => {
        ipfs.add(filePath, { recursive: true })
          .then((result) => {
            const length = result.length
            const filename = filePath.split('/').pop()
            // console.log("hash", result, filename, length)
            // TODO check if still true: "ipfs-api returns an empty dir name as the last hash, ignore this"
            // last added hash is the filename --> we added a directory
            if(result[length - 1].Name === filename) {
              // console.log("ADDED A DIRECTORY")
              resolve({ Hash: result[length - 1].Hash, isDirectory: true })
            } else if(result[0].Name === filePath) {
              // console.log("ADDED A FILE")
              // first added hash is the filename --> we added a file
              resolve({ Hash: result[0].Hash, isDirectory: false })
            }
          }).catch(reject)
      })
    }

    logger.info("Adding file from path '" + source.filename + "'")

    const isBuffer = (source.buffer && source.filename) ? true : false
    // const isDirectory = source.directory ? true : false
    const filename = source.directory ? source.directory.split("/").pop() : source.filename.split("/").pop()
    const size = (source.meta && source.meta.size) ? source.meta.size : 0

    let result, feed
    let addToIpfs

    if(isBuffer) // Adding from browsers
      addToIpfs = () => addToIpfsJs(this._ipfs, source.filename, source.buffer)
    else if(source.directory) // Adding from Electron
      addToIpfs = () => addToIpfsGo(this._ipfs, source.directory)
    else
      addToIpfs = () => addToIpfsGo(this._ipfs, source.filename)

    return this._getChannelFeed(channel)
      .then((res) => feed = res)
      .then(() => addToIpfs())
      .then((res) => result = res)
      // .then(() => isBuffer ? source.buffer.byteLength : utils.getFileSize(source.directory))
      // .then((res) => size = res)
      .then(() => logger.info("Added file '" + source.filename + "' as ", result))
      .then(() => {
        // Create a post
        const type = result.isDirectory ? Post.Types.Directory : Post.Types.File;
        const data = {
          name: filename,
          hash: result.Hash,
          size: size,
          from: this._orbitdb.user.id,
          meta: source.meta || {}
        };
        return this._postMessage(feed, type, data);
      })
  }

  getFile(hash) {
    // Use if .cat doesn't seem to work
    // return new Promise((resolve, reject) => {
    //   const stream = request(`http://localhost:8080/ipfs/${hash}`);
    //   resolve(stream);
    // });
    return this._ipfs.cat(hash);
  }

  getDirectory(hash) {
    return this._ipfs.ls(hash).then((res) => res.Objects[0].Links);
  }

  /* Private methods */

  _getChannelFeed(channel) {
    if(!channel || channel === '')
      return Promise.reject(`Channel not specified`);

    return new Promise((resolve, reject) => {
      const feed = this._channels[channel] && this._channels[channel].feed ? this._channels[channel].feed : null;
      if(!feed) reject(`Haven't joined #${channel}`);
      resolve(feed);
    });
  }

  _postMessage(feed, postType, data) {
    let post
    return Post.create(this._ipfs, postType, data, signKey)
      .then((res) => post = res)
      .then(() => feed.add(post.Hash))
      .then(() => post)
  }

  // TODO: tests for everything below
  _handleError(e) {
    logger.error(e);
    logger.error("Stack trace:\n", e.stack);
    this.events.emit('error', e.message);
    throw e;
  }

  _handleMessage(channel, message) {
    // logger.debug("new messages in ", channel, message);
    if(this._channels[channel])
      this.events.emit('message', channel, message);
  }

  _updateSwarmPeers() {
    if(this._ipfs.libp2p && this._ipfs.libp2p.swarm.peers) {
      // js-_ipfs
      return new Promise((resolve, reject) => {
        this._ipfs.libp2p.swarm.peers((err, peers) => {
          if(err) reject(err);
          resolve(peers);
        });
      })
      .then((peers) => Object.keys(peers).map((e) => peers[e].multiaddrs[0].toString()))
    } else {
      // js-_ipfs-api
      return new Promise((resolve, reject) => {
        return this._ipfs.swarm.peers((err, res) => {
          if(err) reject(err);
          resolve(res);
        });
      })
      .then((peers) => peers.Strings)
    }
  }

}

module.exports = Orbit;

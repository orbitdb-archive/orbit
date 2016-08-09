'use strict';

const path         = require('path');
const EventEmitter = require('events').EventEmitter;
const OrbitDB      = require('orbit-db');
const Post         = require('ipfs-post');
const Logger       = require('logplease');
const logger       = Logger.create("Orbit", { color: Logger.Colors.Green });

// TODO: move utils to the main process in Electron version so that fs can be used
const utils = require('./utils');

const defaultOptions = {
  cacheFile: path.join(utils.getAppPath(), "/orbit-db-cache.json"), // path to orbit-db cache file
  maxHistory: 64 // how many messages to retrieve from history on joining a channel
};

const Crypto = require('orbit-crypto')
let signKey
Crypto.generateKey().then((key) => signKey = key)

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
    logger.debug(`Join #${channel}`);

    if(!channel || channel === '')
      return Promise.reject(`Channel not specified`);

    if(this._channels[channel])
      return Promise.resolve(false);

    this._channels[channel] = {
      name: channel,
      password: null,
      feed: null,
      state: { loading: true, syncing: 0 }
    };

    const dbOptions = {
      cacheFile: this._options.cacheFile,
      maxHistory: this._options.maxHistory
    };

    return this._orbitdb.eventlog(channel, dbOptions)
      .then((db) => this._channels[channel].feed = db)
      .then(() => this.events.emit('joined', channel))
      // .then(() => this._channels[channel].feed.loadHistory())
      .then(() => true)
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
    logger.debug(`Send message to #${channel}: ${message}`);

    if(!message || message === '')
      return Promise.reject(`Can't send an empty message`);

    const data = {
      content: message,
      from: this._orbitdb.user.id
    };

    return this._getChannelFeed(channel)
      .then((feed) => this._postMessage(feed, Post.Types.Message, data))
  }

  get(channel, lessThanHash, greaterThanHash, amount) {
    logger.debug(`Get messages from #${channel}: ${lessThanHash}, ${greaterThanHash}, ${amount}`);

    let options = {
      limit: amount || 1,
      lt: lessThanHash || null,
      gte: greaterThanHash || null
    };

    return this._getChannelFeed(channel)
      .then((feed) => {
        const res = feed.iterator(options).collect()
        console.log("ITEMS:", res.length)
        return res
      });
  }

  getPost(hash) {
    let data, signKey
    return this._ipfs.object.get(hash, { enc: 'base58' })
      .then((res) => data = JSON.parse(res.toJSON().Data))
      // .then(() => console.log("111", data, Buffer.from(data.sig)))
      .then(() => Crypto.importKeyFromIpfs(this._ipfs, data.signKey))
      .then((signKey) => Crypto.verify(
        Buffer.from(data.sig).buffer,
        signKey,
        new Buffer(JSON.stringify({
          content: data.content,
          meta: data.meta,
          replyto: data.replyto
        })))
       )
      .catch((e) => data)
      // .then(() => console.log(data))
      .then(() => data)
  }

  // _verifyPost(postData) {
  // }

  addFile(channel, filePath) {
    if(!filePath || filePath === '')
      return Promise.reject(`Path or Buffer not specified`);

    const addToIpfsJs = (ipfs, filePath, isDirectory) => {
      // TODO
      return new Promise((resolve, reject) => {
        const data = buffer ? new Buffer(buffer) : filePath;
        ipfs.files.add(data).then((hash) => {
          if(isDirectory) {
            // js-_ipfs-api returns an empty dir name as the last hash, ignore this
            if(hash[hash.length-1].Name === '')
              resolve(hash[hash.length-2].Hash);

            resolve(hash[hash.length-1].Hash);
          } else {
            resolve(hash[0].path);
          }
        });
      });
    };

    const addToIpfsGo = (ipfs, filePath, isDirectory) => {
      return new Promise((resolve, reject) => {
        ipfs.add(filePath, { recursive: isDirectory })
          .then((hash) => {
            if(isDirectory) {
              // _ipfs-api returns an empty dir name as the last hash, ignore this
              if(hash[hash.length-1].Name === '')
                resolve(hash[hash.length-2].Hash);

              resolve(hash[hash.length-1].Hash);
            } else {
              resolve(hash[0].Hash);
            }
          }).catch(reject)
      });
    };

    logger.info("Adding file from path '" + filePath + "'");
    let hash, post, size, feed;
    const isBuffer = typeof filePath !== 'string';
    const isDirectory = isBuffer ? false : utils.isDirectory(filePath);
    const addToIpfs = isBuffer ? addToIpfsJs : addToIpfsGo;
    return this._getChannelFeed(channel)
      .then((res) => feed = res)
      .then(() => addToIpfs(this._ipfs, filePath, isDirectory))
      .then((res) => hash = res)
      .then(() => isBuffer ? buffer.byteLength : utils.getFileSize(filePath))
      .then((res) => size = res)
      .then(() => logger.info("Added local file '" + filePath + "' as " + hash))
      .then(() => {
        // Create a post
        const type = isDirectory ? Post.Types.Directory : Post.Types.File;
        const data = {
          name: filePath.split("/").pop(),
          hash: hash,
          size: size,
          from: this._orbitdb.user.id
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

  // _handleMessage2(channel, message) {
  //   logger.debug("new entry from network", channel, message);
  //   if(this._channels[channel])
  //     this.events.emit('message', channel, message);
  // }

  // _handleStartLoading(channel) {
  //   logger.debug("load channel", channel, this._channels);
  //   if(this._channels[channel]) {
  //     this._channels[channel].state.loading = true;
  //     this.events.emit('load', channel);
  //     this.events.emit('update', channel);
  //   }
  // }

  // _handleDatabaseReady(db) {
  //   logger.debug("database ready", db.dbname);
  //   if(this._channels[db.dbname]) {
  //     this._channels[db.dbname].state.loading = false;
  //     this.events.emit('ready', db.dbname);
  //     this.events.emit('update', db.dbname);
  //   }
  // }

  // _handleSync(channel) {
  //   logger.debug("sync channel", channel);
  //   if(this._channels[channel]) {
  //     this._channels[channel].state.syncing += 1;
  //     this.events.emit('sync', channel);
  //     this.events.emit('update', channel);
  //   }
  // }

  // _handleSynced(channel, items) {
  //   logger.debug("channel synced", channel, items.length);
  //   if(this._channels[channel]) {
  //     this._channels[channel].state.syncing -= 1;
  //     this._channels[channel].state.syncing = Math.max(0, this._channels[channel].state.syncing);
  //     this.events.emit('synced', channel, items);
  //     this.events.emit('update', channel);
  //   }
  // }

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

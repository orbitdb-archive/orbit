'use strict';

const fs           = require('fs');
const path         = require('path');
const EventEmitter = require('events').EventEmitter;
// const request      = require('request');
const OrbitDB      = require('orbit-db');
const Post         = require('ipfs-post');
const Logger       = require('logplease');
const logger       = Logger.create("Orbit.Orbit", { color: Logger.Colors.Green });
// Logger.setLogLevel('ERROR');
const utils        = require('./utils');

const defaultOptions = {
  dataPath: path.join(utils.getAppPath(), "/data")
};

class Orbit {
  constructor(ipfs, options) {
    this.ipfs = ipfs;
    this.events = new EventEmitter();
    this.orbitdb = null;
    this.options = options || defaultOptions;
    if(this.options.cacheFile === undefined)
      this.options.cacheFile = path.join(this.options.dataPath, "/orbit-db-cache.json");
    this._channels = {};
  }

  connect(network, username, password) {
    const user = { username: username, password: password };
    logger.debug("Load cache from:", this.options.cacheFile);
    logger.info(`Connecting to network '${network}' as '${username}`);
    return OrbitDB.connect(network, user.username, user.password, this.ipfs)
      .then((orbit) => {
        this.orbitdb = orbit
        this.orbitdb.events.on('data', this._handleMessage.bind(this));
        this.orbitdb.events.on('load', this._handleStartLoading.bind(this));
        this.orbitdb.events.on('ready', this._handleDatabaseReady.bind(this));
        this.orbitdb.events.on('sync', this._handleSync.bind(this));
        this.orbitdb.events.on('synced', this._handleSynced.bind(this));
      })
      .then(() => {
        logger.info(`Connected to '${this.orbitdb.network.name}' at '${this.orbitdb.network.publishers[0]}' as '${user.username}`)
        this.events.emit('network', this.network, this.user);
      })
  }

  disconnect() {
    if(this.orbitdb) {
      logger.warn(`Disconnected from '${this.orbitdb.network.name}' at '${this.orbitdb.network.publishers[0]}'`);
      this.orbitdb.disconnect();
      this.orbitdb = null;
      this._channels = {};
      this.events.emit('network', this.network, this.user);
    }
  }

  join(channel, password, callback) {
    logger.debug(`Join #${channel}`);
    if(!this._channels[channel]) {
      this._channels[channel] = { name: channel, password: password, db: null, state: { loading: true, syncing: true }};
      return this.orbitdb.eventlog(channel, { cacheFile: this.options.cacheFile })
        .then((db) => {
          this._channels[channel].db = db;
          this._channels[channel].state.loading = false;
          this.events.emit('channels.updated', this.channels);
          if(callback) callback(null, channel)
          return this.getChannels();
        });
    } else {
      this.events.emit('ready', channel);
      this.events.emit('channels.updated', this.channels);
    }
    if(callback) callback(null, channel)
    return Promise.resolve(this.channels);
  }

  leave(channel) {
    if(this._channels[channel]) {
      this._channels[channel].db.close();
      delete this._channels[channel];
      logger.debug("Left channel #" + channel);
    }
    this.events.emit('channels.updated', this.getChannels());
    return this.channels;
  }

  get user() {
    return this.orbitdb ? this.orbitdb.user : null;
  }

  get network() {
    return this.orbitdb ? this.orbitdb.network : null;
  }

  get channels() {
    return this.getChannels();
  }

  getUser(hash, callback) {
    // TODO: return user id from ipfs hash (user.id)
    if(callback) callback(this.orbitdb.user.id);
  }

  getSwarmPeers() {
    // js-ipfs
    if(this.ipfs.libp2p.swarm.peers) {
      return new Promise((resolve, reject) => {
        this.ipfs.libp2p.swarm.peers((err, peers) => {
          if(err) reject(err);
          resolve(peers);
        });
      })
      .then((peers) => Object.keys(peers).map((e) => peers[e].multiaddrs[0].toString()));
    } else {
      // js-ipfs-api
      return this.ipfs.swarm.peers
        .then((peers) => peers.Strings)
        .catch((e) => this._handleError(e))
    }
  }

  getChannels(callback) {
    const channels = Object.keys(this._channels)
      .map((f) => this._channels[f])
      // .map((f) => { return { name: f.name, password: f.password, db: f.db, state: f.state } });

    if(callback) callback(channels);
    return channels;
  }

  getMessages(channel, lessThanHash, greaterThanHash, amount, callback) {
    logger.debug(`Get messages from #${channel}: ${lessThanHash}, ${greaterThanHash}, ${amount}`)
    let options = { limit: amount || 1 };
    if(lessThanHash) options.lt = lessThanHash;
    if(greaterThanHash) options.gte = greaterThanHash;
    const messages = this._channels[channel] && this._channels[channel].db
      ? this._channels[channel].db.iterator(options).collect()
      : [];
    if(callback) callback(messages);
    return messages;
  }

  getPost(hash, callback) {
    return this.ipfs.object.get(hash, { enc: 'base58' })
      .then((res) => {
        if(callback)
          callback(null, JSON.parse(res.toJSON().Data));
        return JSON.parse(res.toJSON().Data);
      })
      .catch((e) => {
        this._handleError(e);
        if(callback) callback(e.message, null);
      });
  }

  sendMessage(channel, message, callback) {
    logger.debug(`Send message to #${channel}: ${message}`);

    if(!this._channels[channel] || !this._channels[channel].db)
      return Promise.resolve();

    const data = {
      content: message,
      from: this.orbitdb.user.id
    };
    let post;
    return Post.create(this.ipfs, Post.Types.Message, data)
      .then((res) => post = res)
      .then(() => this._channels[channel].db.add(post.Hash))
      .then((hash) => {
        if(callback)
          callback(null, post);
        return post;
      })
      .catch((e) => {
        this._handleError(e);
        if(callback) callback(e.message);
      });
  }

  addFile(channel, filePath, callback) {
    const addToIpfs = (ipfs, filePath, isDirectory) => {
      return new Promise((resolve, reject) => {
        if(!fs.existsSync(filePath))
          throw "File not found at '" + filePath + "'";

        // this.ipfs.add(filePath, { recursive: recursive }).then((hash) => {
        this.ipfs.add(filePath, { recursive: isDirectory }).then((hash) => {
          logger.debug("H, " + JSON.stringify(hash));

          if(isDirectory) {
            // FIXME: ipfs-api returns an empty dir name as the last hash, ignore this
            if(hash[hash.length-1].Name === '')
              resolve(hash[hash.length-2].Hash);

            resolve(hash[hash.length-1].Hash);
          } else {
            resolve(hash[0].Hash);
          }
        });
      });
    }

    logger.info("Adding file from path '" + filePath + "'");
    let isDirectory = false, size = -1, hash;
    utils.isDirectory(filePath)
      // .then((res) => isDirectory = res)
    addToIpfs(this.ipfs, filePath, utils.isDirectory(filePath))
      .then((res) => hash = res)
      .then(() => utils.getFileSize(filePath))
      .then((res) => size = res)
      .then(() => {
        logger.info("Added local file '" + filePath + "' as " + hash);

        const data = {
          name: filePath.split("/").pop(),
          hash: hash,
          size: size,
          from: this.orbitdb.user.id
        };

        const type = isDirectory ? Post.Types.Directory : Post.Types.File;
        Post.create(this.ipfs, type, data).then((post) => {
          this._channels[channel].db.add(post.Hash).then((hash) => {
            if(callback) callback(null);
          });
        });
      });
  }

  getDirectory(hash, callback) {
    this.ipfs.ls(hash).then((result) => {
      if(result.Objects && callback)
        callback(result.Objects[0].Links);
    }).catch((e) => {
      this._handleError(e);
      if(callback) callback(null);
    });
  }

  getFile(hash, callback) {
    // request('http://localhost:8080/ipfs/' + hash, function (error, response, body) {
    //   if(!error && response.statusCode === 200) {
        if(callback) callback(null);
        // if(callback) callback(body);
    //   }
    // })
  }

  _handleError(e) {
    logger.error(e);
    logger.error("Stack trace:\n", e.stack);
    this.events.emit('orbit.error', e.message);
    throw e;
  }

  _handleMessage(channel, message) {
    logger.debug("new entry in database", channel, message);
    if(this._channels[channel])
      this.events.emit('data', channel, message);
  }

  _handleStartLoading(channel) {
    logger.debug("load channel", channel);
    if(this._channels[channel]) {
      this._channels[channel].state.loading = true;
      this.events.emit('load', channel);
      this.events.emit('state.updated', this.channels);
    }
  }

  _handleDatabaseReady(db) {
    logger.debug("database ready", db.dbname);
    if(this._channels[db.dbname]) {
      this._channels[db.dbname].state.loading = false;
      this.events.emit('ready', db.dbname);
      this.events.emit('state.updated', this.channels);
    }
  }

  _handleSync(channel) {
    logger.debug("sync channel", channel);
    if(this._channels[channel]) {
      this._channels[channel].state.syncing = true;
      this.events.emit('sync', channel);
      this.events.emit('state.updated', this.channels);
    }
  }

  _handleSynced(channel, items) {
    logger.debug("channel synced", channel, items.length);
    if(this._channels[channel]) {
      this._channels[channel].state.syncing = false;
      this.events.emit('synced', channel, items);
      this.events.emit('state.updated', this.channels);
    }
  }

  onSocketConnected(socket) {
    this.events.emit('network', this.orbitdb);
  }

}

module.exports = Orbit;

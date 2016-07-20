'use strict';

const fs           = require('fs');
const path         = require('path');
const EventEmitter = require('events').EventEmitter;
const OrbitDB      = require('orbit-db');
const Post         = require('ipfs-post');
const Logger       = require('logplease');
const utils        = require('./utils');
const logger       = Logger.create("Orbit.Orbit", { color: Logger.Colors.Green });
// const request      = require('request');

const defaultOptions = {
  cacheFile: path.join(utils.getAppPath(), "/data", "/orbit-db-cache.json"),
  maxHistory: 64 // how many messages to retrieve from history on joining a channel
};

class Orbit {
  constructor(ipfs, options) {
    this.events = new EventEmitter();
    this._ipfs = ipfs;
    this._orbitdb = null;
    this._channels = {};
    this._peers = [];
    this._options = {};
    Object.assign(this._options, defaultOptions);
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
    return Object.keys(this._channels).map((f) => this._channels[f]);
  }

  get peers() {
    return this._peers;
  }

  /* Public methods */

  connect(network, username, password) {
    const user = { username: username, password: password };
    logger.debug("Load cache from:", this._options.cacheFile);
    logger.info(`Connecting to network '${network}' as '${username}`);
    return OrbitDB.connect(network, user.username, user.password, this._ipfs)
      .then((_orbitdb) => {
        this._orbitdb = _orbitdb;

        // Subscribe to database events
        this._orbitdb.events.on('message', this._handleMessage2.bind(this));
        this._orbitdb.events.on('data', this._handleMessage.bind(this));
        this._orbitdb.events.on('load', this._handleStartLoading.bind(this));
        this._orbitdb.events.on('ready', this._handleDatabaseReady.bind(this));
        this._orbitdb.events.on('sync', this._handleSync.bind(this));
        this._orbitdb.events.on('synced', this._handleSynced.bind(this));

        // Get peers from libp2p and update the local peers array
        setInterval(() => {
          this._updateSwarmPeers().then((peers) => this._peers = peers);
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
    if(!channel || channel === '')
      return Promise.reject(`Channel not specified`);

    logger.debug(`Join #${channel}`);

    if(this._channels[channel]) {
      // this.events.emit('ready', channel);
      return Promise.resolve(false);
    }

    this._channels[channel] = {
      name: channel,
      password: null,
      db: null,
      state: { loading: true, syncing: 0 }
    };

    const dbOptions = {
      cacheFile: this._options.cacheFile,
      maxHistory: this._options.maxHistory
    };

    return this._orbitdb.eventlog(channel, dbOptions)
      .then((db) => this._channels[channel].db = db)
      .then(() => this.events.emit('joined', channel))
      .then(() => true)
  }

  leave(channel) {
    if(this._channels[channel]) {
      this._channels[channel].db.close();
      delete this._channels[channel];
      logger.debug("Left channel #" + channel);
    }
    this.events.emit('left', channel);
  }

  send(channel, message) {
    if(!channel || channel === '')
      return Promise.reject(`Channel not specified`);

    if(!message || message === '')
      return Promise.reject(`Can't send an empty message`);

    const db = this._channels[channel] && this._channels[channel].db ? this._channels[channel].db : null;

    if(!db)
      return Promise.reject(`Can't send the message, not joined on #${channel}`);

    logger.debug(`Send message to #${channel}: ${message}`);

    const data = {
      content: message,
      from: this._orbitdb.user.id
    };

    let post;
    return Post.create(this._ipfs, Post.Types.Message, data)
      .then((res) => post = res)
      .then(() => db.add(post.Hash))
      .then((hash) => post)
  }

  get(channel, lessThanHash, greaterThanHash, amount) {
    const db = this._channels[channel] && this._channels[channel].db ? this._channels[channel].db : null;
    if(!db) throw `Not joined on #${channel}`;

    logger.debug(`Get messages from #${channel}: ${lessThanHash}, ${greaterThanHash}, ${amount}`)

    let options = {
      limit: amount || 1,
      lt: lessThanHash || null,
      gte: greaterThanHash || null
    };

    return db.iterator(options).collect();
  }

  getPost(hash) {
    return this._ipfs.object.get(hash, { enc: 'base58' })
      .then((res) => JSON.parse(res.toJSON().Data))
  }

  addFile(channel, filePath) {
    if(!channel || channel === '')
      return Promise.reject(`Channel not specified`);

    if(!filePath || filePath === '')
      return Promise.reject(`Path or Buffer not specified`);

    const isBuffer = typeof filePath !== 'string';
    const db = this._channels[channel] && this._channels[channel].db ? this._channels[channel].db : null;

    if(!db)
      return Promise.reject(`Can't send the message, not joined on #${channel}`);

    const addToIpfsJs = (_ipfs, filePath, isDirectory) => {
      // TODO
      return new Promise((resolve, reject) => {
        const data = buffer ? new Buffer(buffer) : filePath;
        this._ipfs.files.add(data).then((hash) => {
          // logger.debug("H, " + JSON.stringify(hash));
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

    const addToIpfsGo = (_ipfs, filePath, isDirectory) => {
      return new Promise((resolve, reject) => {
        if(!fs.existsSync(filePath))
          reject(`File not found: ${filePath}`);

        this._ipfs.add(filePath, { recursive: isDirectory })
          .then((hash) => {
            // logger.debug("Added: " + JSON.stringify(hash));
            if(isDirectory) {
              // _ipfs-api returns an empty dir name as the last hash, ignore this
              if(hash[hash.length-1].Name === '')
                resolve(hash[hash.length-2].Hash);

              resolve(hash[hash.length-1].Hash);
            } else {
              resolve(hash[0].Hash);
            }
          });
      });
    };

    logger.info("Adding file from path '" + filePath + "'");
    let hash, post, size;
    let isDirectory = isBuffer ? false : utils.isDirectory(filePath);
    const add = isBuffer ? addToIpfsJs : addToIpfsGo;
    return add(this._ipfs, filePath, isDirectory)
      .then((res) => hash = res)
      .then(() => isBuffer ? buffer.byteLength : utils.getFileSize(filePath))
      .then((res) => size = res)
      .then(() => logger.info("Added local file '" + filePath + "' as " + hash))
      .then(() => {
        // Create a post and add it to the channel
        const type = isDirectory ? Post.Types.Directory : Post.Types.File;
        const data = {
          name: filePath.split("/").pop(),
          hash: hash,
          size: size,
          from: this._orbitdb.user.id
        };
        return Post.create(this._ipfs, type, data);
      })
      .then((res) => post = res)
      .then(() => db.add(post))
      .then(() => post)
  }

  getFile(hash) {
    // Use if .cat doesn't seem to work
    // return new Promise((resolve, reject) => {
    //   const stream = request('http://localhost:8080/_ipfs/' + hash);
    //   resolve(stream);
    // });
    return this._ipfs.cat(hash);
  }

  getDirectory(hash) {
    return this._ipfs.ls(hash).then((res) => res.Objects[0].Links);
  }

  /* Private methods */

  // TODO: tests for everything below
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

  _handleMessage2(channel, message) {
    logger.debug("new entry from network", channel, message);
    if(this._channels[channel])
      this.events.emit('message', channel, message);
  }

  _handleStartLoading(channel) {
    logger.debug("load channel", channel, this._channels);
    if(this._channels[channel]) {
      this._channels[channel].state.loading = true;
      this.events.emit('load', channel);
      this.events.emit('update', this.channels);
    }
  }

  _handleDatabaseReady(db) {
    logger.debug("database ready", db.dbname);
    if(this._channels[db.dbname]) {
      this._channels[db.dbname].state.loading = false;
      this.events.emit('ready', db.dbname);
      this.events.emit('update', this.channels);
    }
  }

  _handleSync(channel) {
    logger.debug("sync channel", channel);
    if(this._channels[channel]) {
      this._channels[channel].state.syncing += 1;
      this.events.emit('sync', channel);
      this.events.emit('update', this.channels);
    }
  }

  _handleSynced(channel, items) {
    logger.debug("channel synced", channel, items.length);
    if(this._channels[channel]) {
      this._channels[channel].state.syncing -= 1;
      this._channels[channel].state.syncing = Math.max(0, this._channels[channel].state.syncing);
      this.events.emit('synced', channel, items);
      this.events.emit('update', this.channels);
    }
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

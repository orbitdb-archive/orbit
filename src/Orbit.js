'use strict';

const fs           = require('fs');
const path         = require('path');
const EventEmitter = require('events').EventEmitter;
const OrbitDB      = require('orbit-db');
const Post         = require('ipfs-post');
const Logger       = require('logplease');
const logger       = Logger.create("Orbit.Orbit", { color: Logger.Colors.Green });
const utils        = require('./utils');

const defaultOptions = {
  cacheFile: path.join(utils.getAppPath(), "/data", "/orbit-db-cache.json"),
  maxHistory: 64 // how many messages to retrieve from history on joining a channel
};

class Orbit {
  constructor(ipfs, options) {
    this.ipfs = ipfs;
    this.events = new EventEmitter();
    this.orbitdb = null;
    this._channels = {};
    this._peers = [];

    this.options = {};
    Object.assign(this.options, defaultOptions);
    Object.assign(this.options, options);
  }

  connect(network, username, password) {
    const user = { username: username, password: password };
    logger.debug("Load cache from:", this.options.cacheFile);
    logger.info(`Connecting to network '${network}' as '${username}`);
    return OrbitDB.connect(network, user.username, user.password, this.ipfs)
      .then((orbit) => {
        this.orbitdb = orbit
        this.orbitdb.events.on('message', this._handleMessage2.bind(this));
        this.orbitdb.events.on('data', this._handleMessage.bind(this));
        this.orbitdb.events.on('load', this._handleStartLoading.bind(this));
        this.orbitdb.events.on('ready', this._handleDatabaseReady.bind(this));
        this.orbitdb.events.on('sync', this._handleSync.bind(this));
        this.orbitdb.events.on('synced', this._handleSynced.bind(this));

        // Get peers from libp2p and update the local peers array
        setInterval(() => {
          this._updateSwarmPeers().then((peers) => this._peers = peers);
        }, 1000);
      })
      .then(() => {
        logger.info(`Connected to '${this.orbitdb.network.name}' at '${this.orbitdb.network.publishers[0]}' as '${user.username}`)
        // this.events.emit('network', this.network, this.user);
        this.events.emit('connected', this.network, this.user);
        return this;
      })
  }

  disconnect() {
    if(this.orbitdb) {
      logger.warn(`Disconnected from '${this.orbitdb.network.name}' at '${this.orbitdb.network.publishers[0]}'`);
      this.orbitdb.disconnect();
      this.orbitdb = null;
      this._channels = {};
      this.events.emit('disconnected');
    }
  }

  join(channel, password) {
    logger.debug(`Join #${channel}`);
    if(!this._channels[channel]) {
      this._channels[channel] = {
        name: channel,
        password: password,
        db: null,
        state: { loading: true, syncing: 0 }
      };

      const options = {
        cacheFile: this.options.cacheFile,
        maxHistory: this.options.maxHistory
      };

      return this.orbitdb.eventlog(channel, options)
        .then((db) => {
          this._channels[channel].db = db;
          this._channels[channel].state.loading = false;
          this.events.emit('joined', channel);
          return this.channels;
        });
    } else {
      this.events.emit('ready', channel);
      this.events.emit('joined', channel);
    }
    return Promise.resolve(this.channels);
  }

  leave(channel) {
    if(this._channels[channel]) {
      this._channels[channel].db.close();
      delete this._channels[channel];
      logger.debug("Left channel #" + channel);
    }
    this.events.emit('left', channel);
  }

  get user() {
    return this.orbitdb ? this.orbitdb.user : null;
  }

  get network() {
    return this.orbitdb ? this.orbitdb.network : null;
  }

  get channels() {
    return Object.keys(this._channels).map((f) => this._channels[f]);
  }

  get peers() {
    return this._peers;
  }

  send(channel, message) {
    logger.debug(`Send message to #${channel}: ${message}`);

    const db = this._channels[channel] && this._channels[channel].db ? this._channels[channel].db : null;
    if(!db) return Promise.reject(`Not joined on #${channel}`);

    const data = {
      content: message,
      from: this.orbitdb.user.id
    };

    let post;
    return Post.create(this.ipfs, Post.Types.Message, data)
      .then((res) => post = res)
      .then(() => {
        // console.log("POST", post)
        return db.add(post.Hash)
      })
      .then((hash) => post)
  }

  get(channel, lessThanHash, greaterThanHash, amount) {
    logger.debug(`Get messages from #${channel}: ${lessThanHash}, ${greaterThanHash}, ${amount}`)

    const db = this._channels[channel] && this._channels[channel].db ? this._channels[channel].db : null;
    if(!db) throw `Not joined on #${channel}`;

    let options = {
      limit: amount || 1,
      lt: lessThanHash || null,
      gte: greaterThanHash || null
    };
    // let options = { limit: amount || 1 };
    // if(lessThanHash) options.lt = lessThanHash;
    // if(greaterThanHash) options.gte = greaterThanHash;
    return db.iterator(options).collect();
  }

  getUser(hash, callback) {
    // TODO: return user id from ipfs hash (user.id)
    if(callback) callback(this.orbitdb.user.id);
  }

  getPost(hash) {
    return this.ipfs.object.get(hash, { enc: 'base58' })
      .then((res) => JSON.parse(res.toJSON().Data))
      .catch((e) => this._handleError(e));
  }

  addFile(channel, filePath, buffer) {
    console.log("!!!!!!!!!!!!!", typeof filePath === 'string')
    console.log(channel, filePath);

    const addToIpfs = (ipfs, filePath, isDirectory) => {
      return new Promise((resolve, reject) => {
        // if(!fs.existsSync(filePath))
        //   throw "File not found at '" + filePath + "'";

        // this.ipfs.add(filePath, { recursive: recursive }).then((hash) => {
        const data = buffer ? new Buffer(buffer) : filePath;
        this.ipfs.files.add(data).then((hash) => {
          // logger.debug("H, " + JSON.stringify(hash));

          if(isDirectory) {
            // FIXME: ipfs-api returns an empty dir name as the last hash, ignore this
            if(hash[hash.length-1].Name === '')
              resolve(hash[hash.length-2].Hash);

            resolve(hash[hash.length-1].Hash);
          } else {
            resolve(hash[0].path);
          }
        });
      });
    }

    logger.info("Adding file from path '" + filePath + "'");
    let isDirectory = false;
    let size = buffer ? buffer.byteLength : -1;
    let hash;
    // utils.isDirectory(filePath)
    // addToIpfs(this.ipfs, filePath, utils.isDirectory(filePath))
    return addToIpfs(this.ipfs, filePath, isDirectory)
      .then((res) => hash = res)
      // .then(() => utils.getFileSize(filePath))
      // .then((res) => size = res)
      .then(() => {
        logger.info("Added local file '" + filePath + "' as " + hash);

        const data = {
          name: filePath.split("/").pop(),
          hash: hash,
          size: size,
          from: this.orbitdb.user.id
        };

        const type = isDirectory ? Post.Types.Directory : Post.Types.File;
        return Post.create(this.ipfs, type, data).then((post) => {
          return this._channels[channel].db.add(post.Hash);
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

  // onSocketConnected(socket) {
  //   this.events.emit('network', this.orbitdb);
  // }

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
      this._channels[channel].state.syncing += 1;
      this.events.emit('sync', channel);
      this.events.emit('state.updated', this.channels);
    }
  }

  _handleSynced(channel, items) {
    logger.debug("channel synced", channel, items.length);
    if(this._channels[channel]) {
      this._channels[channel].state.syncing -= 1;
      this._channels[channel].state.syncing = Math.max(0, this._channels[channel].state.syncing);
      this.events.emit('synced', channel, items);
      this.events.emit('state.updated', this.channels);
    }
  }

  _updateSwarmPeers() {
    if(this.ipfs.libp2p && this.ipfs.libp2p.swarm.peers) {
      // js-ipfs
      return new Promise((resolve, reject) => {
        this.ipfs.libp2p.swarm.peers((err, peers) => {
          if(err) reject(err);
          resolve(peers);
        });
      })
      .then((peers) => Object.keys(peers).map((e) => peers[e].multiaddrs[0].toString()))
    } else {
      // js-ipfs-api
      return new Promise((resolve, reject) => {
        return this.ipfs.swarm.peers((err, res) => {
          if(err) reject(err);
          resolve(res);
        });
      })
      .then((peers) => peers.Strings)
    }
  }

}

module.exports = Orbit;

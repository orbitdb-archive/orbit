'use strict';

const EventEmitter  = require('events').EventEmitter;
const await         = require('asyncawait/await');
const async         = require('asyncawait/async');
const OrbitDB       = require('orbit-db');

class OrbitNetwork {
  constructor(ipfs) {
    this._ipfs = ipfs;
    this._client = null;
    this._user = null;
    this._network = null;
    this._channels = {};
    this.events = null;
  }

  get channels() {
    return Object.keys(this._channels)
      .map((f) => this._channels[f])
      .map((f) => {
        return { name: f.name, password: f.password };
      });
  }

  connect(host, port, username, password) {
    this.events = new EventEmitter();
    this._client = OrbitDB.connect(host, port, username, password, this._ipfs);
    this._user = this._client.user;
    this._network = this._client.network;
    this._client.events.on('data', (channel, message) => {
      this.events.emit('message', channel, message);
    });
  }

  disconnect() {
    this._client.disconnect();
    this._client = null;
    this._user = null;
    this._network = null;
    this._channels = {};
    this.events = null;
  }

  joinChannel(channel, password) {
    if(!this._channels[channel]) {
      const db = this._client.channel(channel, password);
      this._channels[channel] = { name: channel, password: password, db: db };
    }
  }

  leaveChannel(channel) {
    if(this._channels[channel]) {
      this._channels[channel].db.close();
      delete this._channels[channel];
    }
  }

  publish(channel, data) {
    if(!this._client)
      throw new Error("Not connected to an Orbit Network");

    const db = this._channels[channel].db;
    return db.add(data);
  }

  getMessages(channel, options) {
    if(!this._client)
      throw new Error("Not connected to an Orbit Network");

    const db = this._channels[channel].db;
    return db.iterator(options).collect();
  }

  get user() {
    return this._user;
  }

  get network() {
    return this._network;
  }
}

class OrbitNetworkFactory {
  static connect(host, port, username, password, ipfs) {
    const client = new OrbitNetwork(ipfs);
    client.connect(host, port, username, password);
    return client;
  }
}

module.exports = OrbitNetworkFactory;

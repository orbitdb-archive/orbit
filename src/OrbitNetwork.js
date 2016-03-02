'use strict';

const EventEmitter  = require('events').EventEmitter;
const await         = require('asyncawait/await');
const async         = require('asyncawait/async');
const OrbitDB       = require('orbit-db');
const ChannelSystem = require('./ChannelSystem');

class OrbitNetwork {
  constructor(ipfs) {
    this._ipfs = ipfs;
    this._client = null;
    this._user = null;
    this._network = null;
    this.channels = {};
    this.events = new EventEmitter();
  }

  connect(host, port, username, password) {
    this._client = OrbitDB.connect(host, port, username, password, this._ipfs);
    this._user = this._client.user;
    this._network = this._client.network;
    this._client.events.on('data', (channel, message) => this.events.emit('message', channel, message));
  }

  disconnect() {
    this._client.disconnect();
    this._client = null;
    this._user = null;
    this._network = null;
    this.channels = {};
    this.events = null;
  }

  joinChannel(channel, password) {
    const db = this._client.channel(channel, password);
    this.channels[channel] = { password: password, db: db };
    // this.channels.join(channel, password)
    // this.channels.channels.onMessage((channel, message) => {
    //   this.events.emit('message', channel, message);
    // });
  }

  publish(channel, data) {
    if(!this._client)
      throw new Error("Not connected to an Orbit Network");

    const db = this.channels[channel].db;
    return db.add(data);
  }

  getMessages(channel, options) {
    if(!this._client)
      throw new Error("Not connected to an Orbit Network");

    const db = this.channels[channel].db;
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

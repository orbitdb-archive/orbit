'use strict';

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
    this.channels = new ChannelSystem();
  }

  connect(host, port, username, password) {
    this._client = OrbitDB.connect(host, port, username, password, this._ipfs);
    this._user = this._client.user;
    this._network = this._client.network;
  }

  disconnect() {
    this._client.disconnect();
    this._client = null;
    this._user = null;
    this._network = null;
  }

  joinChannel(channel, password, onMessageCallback) {
    this.channels.join(channel, password)
    this.channels.channels.onMessage(onMessageCallback);
  }

  publish(channel, text, options) {
    if(!this.client)
      throw "Not connected to an Orbit Network";

    var head = null;
    var chan = this.channels.list()[channel];
    head = await (this.client.channel(channel, chan && chan.password ? chan.password : '').send(text, options));

    return head;
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

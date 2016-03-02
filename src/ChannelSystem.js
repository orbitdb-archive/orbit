'use strict';

var async = require('asyncawait/async');
var await = require('asyncawait/await');

class ChannelSystem {
  constructor() {
    // this.client        = orbitClient;
    this.channels      = {};
    this.subscribers   = [];
    // this._pollers      = {};
    // this._pollInterval = options && options.pollInterval ? options.pollInterval : 1000;
  }

  list() {
    return this.channels;
  }

  join(channel, password) {
    this.channels[channel] = { password: password, info: {} }
    this._listenChannel(channel, password);
  }

  leave(channel) {
    this._stopListeningChannel(channel);
    delete this.channels[channel];
  }

  leaveAll() {
    Object.keys(this.channels).forEach(this.leave.bind(this));
  }

  send(channel, message) {
    if(this.channels[channel] === undefined) throw `Not on ${channel}`;

    var password = this.channels[channel].password;
    return this.client.channel(channel, password).send(message);
  }

  onMessage(callback) {
    this.subscribers.push(callback);
  }

  _listenChannel(channel, password) {
    if(!this._pollers[channel]) {
      this._pollers[channel] = setInterval(async (() => {
        var info = this.client.channel(channel, password).info();
        if(info.head != this.channels[channel].info.head) {
          console.log("NEW HEAD", info);
          this.channels[channel].info = info;
          this.subscribers.forEach((callback) => {
            callback(channel, "new message #1: ", hash);
          })
        }
      }), this._pollInterval);
    }
  }

  _stopListeningChannel(channel) {
    clearInterval(this._pollers[channel]);
    delete this._pollers[channel];
  }
}

module.exports = ChannelSystem;

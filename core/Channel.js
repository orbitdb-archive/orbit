'use strict';
var Base58      = require('bs58');
var crypto      = require('crypto');

class Channel {
  constructor(name, password) {
    this.name     = name;
    this.hash     = Channel.createChannelHash(this.name);
    this.password = password;
  }

  static createChannelHash(channelName) {
    return Base58.encode(crypto.createHash('sha256').update(channelName).digest());
  }
}

module.exports = Channel;
'use strict';

var _           = require('lodash');
var await       = require('asyncawait/await');
var Bot         = require('../core/bots/Bot');
var Channel     = require('../core/Channel')
var networkAPI  = require('../core/network-api');
var ipfsAPI     = require('../core/ipfs-api-promised');
var logger      = require('../core/logger');

var channels = ["bots", "ipfs"];

class CacherBot extends Bot {
  constructor(ipfs, events, user) {
    super(ipfs, events, user);
    this.previousMessages = [];
  }

  onInit() {
    this.subscribeTo(channels);
  }

  // Called when the system has started (ie. we have connection to the server and ipfs is running)
  onStarted() {
    channels.forEach((channelName) => {
      networkAPI.sendMessage(this.ipfs, "/me is now caching this channel", channelName, this.user.id, null, null)
        .catch((err) => logger.error("Couldn't send message:", err));
    });
  }

  onMessage(channel, message) {
    // TODO: need message's hash as part of the message
    var isMessage = message.Data.payload.type === 'msg';
    var notFromMe = message.Data.payload.uid != this.user.id
    if(isMessage && notFromMe)
      this.doLogic(channel, message);
  }

  doLogic(channel, message) {
    logger.debug("CacherBot processing the message...");
    var hash = message.Data.payload.hash;
    // TODO: await these
    networkAPI.getObject(this.ipfs, hash)
      .then((result) => {
        ipfsAPI.pinObject(this.ipfs, hash)
          .then((res) => logger.info("Cached", hash));
      })
      .catch((err) => logger.error("Error getting object " + hash, err));
  }

}

module.exports = CacherBot;

'use strict';

var _           = require('lodash');
var await       = require('asyncawait/await');
var Bot         = require('../core/bots/Bot');
var networkAPI  = require('../core/network-api');
var logger      = require('../core/logger');

var channels = ["bots", "ipfs"];

class PinBot extends Bot {
  constructor(ipfs, events, user) {
    super(ipfs, events, user);
  }

  onInit() {
    this.subscribeTo(channels);
  }

  onStart() {
  }

  onMessage(channel, message) {
    var isMessage = message.Data.payload.type === 'msg';
    var notFromMe = message.Data.payload.uid != this.user.id
    if(isMessage && notFromMe)
      this.doLogic(channel, message);
  }

  doLogic(channel, message) {
    logger.debug("PinBot processing the message...");
    var hash = message.Data.payload.hash;
    networkAPI.getObject(this.ipfs, hash)
      .then((result) => {
        var data = JSON.parse(result.Data);
        var content = data.content;
        if(content.startsWith("!pin")) {
          var hashToPin = content.split(" ")[1];
          var username;
          networkAPI.getUser(this.ipfs, message.Data.payload.uid)
            .then((res) => {
              username = res;
              if(!hashToPin.startsWith("Qm") || hashToPin.length !== 46) {
                networkAPI.sendMessage(this.ipfs, username + ": Doesn't look like a correct hash: '" + hashToPin + "'", channel, this.user.id, null, null) // TODO: add password support (last two params)
                  .then((res) => {
                    return;
                  })
                  .catch((err) => logger.error("Couldn't send message:", err));
              } else {
                networkAPI.sendMessage(this.ipfs, username + ": Pinned " + hashToPin, channel, this.user.id, null, null) // TODO: add password support (last two params)
                  .catch((err) => logger.error("Couldn't send message:", err));
              }
            })
            .catch((err) => logger.error(err));
        }
      })
      .catch((err) => logger.error("Error getting object " + hash, err));
  }

}

module.exports = PinBot;

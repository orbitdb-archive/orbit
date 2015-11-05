'use strict';

var _           = require('lodash');
var await       = require('asyncawait/await');
var Bot         = require('../core/bots/Bot');
var networkAPI  = require('../core/network-api');
var logger      = require('../core/logger');

var channels = ["silence"];

class TestBot extends Bot {
  constructor(ipfs, events, user) {
    super(ipfs, events, user);
    this.previousMessages = [];
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
    logger.debug("RepeaterBot processing the message...");
    var hash = message.Data.payload.hash;
    networkAPI.getObject(this.ipfs, hash)
      .then((result) => {
        if(result) {
          var data = JSON.parse(result.Data);
          var content = data.content;
          if(content.startsWith("!") && content.startsWith("!repeat")) {
            var previousMsg = this.previousMessages[this.previousMessages.length - 1];
            networkAPI.sendMessage(this.ipfs, "I heard you say: " + previousMsg, channel, this.user.id, null, null) // TODO: add password support (last two params)
              .catch((err) => logger.error("Couldn't send message:", err));
            this.previousMessages.pop();
          } else {
            this.previousMessages.push(content)          ;
          }
        } else {
          console.log("couldn't fetch the object");
        }
      })
      .catch((err) => logger.error("Error getting object " + hash, err));
  }

}

module.exports = TestBot;

'use strict';

var _           = require('lodash');
var await       = require('asyncawait/await');
var channelHash = require('../Channel').createChannelHash;
var networkAPI  = require('../network-api');
var logger      = require('../logger');

class Bot {
  constructor(ipfs, events, user) {
    this.ipfs = ipfs;
    this.user = user;
    this.subscriptions = [];
    this.events = events;
    this.events.on("message", this.handleMessage.bind(this));
  }

  init() {
    logger.info("Initialize '" + this.constructor.name + "'");
    this.onInit();
    this.subscriptions.forEach((channel) => await (networkAPI.joinChannel(this.ipfs, channel, this.user, null))); // TODO: add pasword support (last param)
  }

  start() {
    logger.info("Start '" + this.constructor.name + "'");
    this.onStarted();
  }

  handleMessage(channel, message) {
    if(_.includes(this.subscriptions, channel)) {
      this.onMessage(channel, message);
    }
  }

  subscribeTo(channels) {
    channels.forEach((c) => this.subscriptions.push(channelHash(c)));
  }

  onInit() {}
  onStarted() {}
  onMessage(channel, message) {}

}

module.exports = Bot;

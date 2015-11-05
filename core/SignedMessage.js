'use strict';

var encryption = require('./Encryption');
var logger     = require('./logger');

class SignedMessage {
  constructor(sequenceNumber, payload, publicKey, privateKey, salt) {
    this.seq     = sequenceNumber;
    this.pubkey  = publicKey;
    this.payload = encryption.encrypt(JSON.stringify(payload), privateKey);
    try {
      this.sig = encryption.sign(this.payload, privateKey, this.seq, salt || "");
    } catch(e) {
      logger.error("Signing the message failed:", e)
    }
  }
}

module.exports = SignedMessage;
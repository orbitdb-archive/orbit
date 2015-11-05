'use strict';

var encryption = require('./Encryption');
var logger     = require('./logger');

class MetaInfo {
  constructor(targetHash, type, size, uid, ts) {
    this.hash = targetHash;
    this.type = type;
    this.uid  =  uid;
    this.size = size;
    this.ts   =   ts;
  }
}

module.exports = MetaInfo;

'use strict';
var fs = require('fs');

class NetworkConfig {
  static fromFile(filename) {
    var conf = JSON.parse(fs.readFileSync(filename));
    return { host: conf.Network.split(":")[0], port: conf.Network.split(":")[1] };
  }
}

module.exports = NetworkConfig;
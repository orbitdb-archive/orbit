'use strict';
var fs = require('fs');

class Network {
  constructor(host, port) {
    this.host = host;
    this.port = port;
    this.address = host + ":" + port;
  }

  static fromConfig(configFilename) {
    var networkConfig = JSON.parse(fs.readFileSync(configFilename));
    return new Network(networkConfig.Network.split(":")[0], networkConfig.Network.split(":")[1])
  }
}

module.exports = Network;
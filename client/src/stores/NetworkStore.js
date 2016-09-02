'use strict';

import Reflux from 'reflux';
import AppActions from 'actions/AppActions';
import NetworkActions from 'actions/NetworkActions';
import Logger from 'logplease';

const logger = Logger.create('NetworkStore', { color: Logger.Colors.Yellow });

var NetworkStore = Reflux.createStore({
  listenables: [AppActions, NetworkActions],
  init: function() {
    this.network = null;
  },
  onInitialize: function(orbit) {
    this.orbit = orbit;
    this.orbit.events.on('connected', (network, user) => {
      logger.info("orbit.event: network", network, user)
      this._updateNetwork(network)
    });
    this._updateNetwork(null);
  },
  _updateNetwork: function(network, user) {
    logger.debug("Received network state");
    if(!network) logger.debug("Not connected to a network");
    this.network = network;
    this.trigger(this.network);
  },
  // onConnect: function(host, username, password, signKey, profileData) {
  onConnect: function(host, username) {
    logger.debug("Connect to " + host + " as " + username);
    // this.orbit.connect(host, username, password, signKey, profileData)
    this.orbit.connect(host, username)
      .catch((e) => logger.error(e))
  },
  onDisconnect: function() {
    logger.debug("Disconnect");
    this._updateNetwork(null);
  }
});

export default NetworkStore;

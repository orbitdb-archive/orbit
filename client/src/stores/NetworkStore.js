'use strict';

import Reflux from 'reflux';
import AppActions from 'actions/AppActions';
import SocketActions from 'actions/SocketActions';
import NetworkActions from 'actions/NetworkActions';
import Logger from 'logplease';

const logger = Logger.create('NetworkStore', { color: Logger.Colors.Yellow });

var NetworkStore = Reflux.createStore({
  listenables: [AppActions, NetworkActions, SocketActions],
  init: function() {
    this.network = null;
  },
  network: function() {
    return this.network;
  },
  onInitialize: function(orbit) {
    this.orbit = orbit;
    this.orbit.events.on('connected', (network, user) => {
      logger.info("orbit.event: network", network, user)
      this._updateNetwork(network)
    });
    this._updateNetwork(null)
  },
  _updateNetwork: function(network, user) {
    logger.debug("Received network state");
    if(!network) logger.debug("Not connected to a network");
    this.network = network;
    this.trigger(this.network);
    // NetworkActions.updateUser(network ? network.user : null);
  },
  onConnect: function(host, username, password) {
    logger.debug("Connect to " + host + " as " + username);
    this.orbit.connect(host, username, password);
  },
  onDisconnect: function() {
    logger.debug("Disconnect");
    this.init();
    this.trigger(this.network);
  },
  onGetPeers: function(callback) {
    // logger.debug("swarm.get");
    if(this.orbit) this.orbit.getSwarmPeers().then(callback);
  }
});

export default NetworkStore;

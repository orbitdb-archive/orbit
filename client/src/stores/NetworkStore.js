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
    this.orbit.events.on('network', (network) => {
      logger.info("orbit.event: network", network)
      this._updateNetwork(network)
    });
    this._updateNetwork(null)
  },
  _updateNetwork: function(network) {
    logger.debug("Received network state");
    if(!network) logger.debug("not connected to a network");
    this.network = network;
    this.trigger(this.network);
    NetworkActions.updateUser(network ? network.user : null);
  },
  onSocketConnected: function(socket) {
    logger.debug("connected");
    this.socket = socket;
    this.socket.on('orbit.error', (err) => {
      logger.error("Register error");
      console.log(err);
      NetworkActions.registerError(err);
    });
  },
  onSocketDisconnected: function() {
    this.socket.removeAllListeners('orbit.error');
    this.socket = null;
    this.network = null;
    this.trigger(this.network);
  },
  onConnect: function(host, username, password) {
    // if(!this.socket) {
    //   console.error("Socket not connected");
    //   return;
    // }
    logger.debug("Connect to " + host + " as " + username);
    // this.socket.emit('register', host, username, password); // TODO: rename event to 'connect'
    this.orbit.connect(host, username, password);
  },
  onDisconnect: function() {
    logger.debug("disconnect");
    this.socket.emit('network.disconnect');
    this.init();
    this.trigger(this.network);
  },
  onGetPeers: function(callback) {
    if(!this.socket) {
      console.error("Socket not connected");
      return;
    }
    logger.debug("swarm.get");
    this.socket.emit('swarm.get', callback);
  }
});

export default NetworkStore;

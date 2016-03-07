'use strict';

import Reflux         from 'reflux';
import SocketActions  from 'actions/SocketActions';
import NetworkActions from 'actions/NetworkActions';

var NetworkStore = Reflux.createStore({
  listenables: [NetworkActions, SocketActions],
  init: function() {
    this.network = null;
    NetworkActions.connected.listen(this._updateNetwork);
  },
  _updateNetwork: function(network) {
    console.log("--> received network:", network);
    this.network = network;
    this.trigger(this.network);
  },
  onSocketConnected: function(socket) {
    console.log("NetworkStore connected");
    this.socket = socket;
    this.socket.on('orbit.error', (err) => {
      console.error("Register error:", err);
      NetworkActions.registerError(err);
    });
  },
  onSocketDisconnected: function() {
    this.socket.removeAllListeners('registered');
    this.socket.removeAllListeners('orbit.error');
    this.socket = null;
    this.network = null;
    this.trigger(this.network);
  },
  onConnect: function(host, username, password) {
    if(!this.socket) {
      console.error("Socket not connected");
      return;
    }
    console.log("--> connect", host, username, "********");
    this.socket.emit('register', host, username, password); // TODO: rename event to 'connect'
  },
  onDisconnect: function() {
    console.log("--> disconnect");
    this.socket.emit('deregister');
    this.init();
    this.trigger(this.network);
  }
});

export default NetworkStore;

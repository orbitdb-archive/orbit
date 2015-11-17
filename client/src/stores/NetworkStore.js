'use strict';

import Reflux         from 'reflux';
import SocketActions  from 'actions/SocketActions';
import NetworkActions from 'actions/NetworkActions';

var NetworkStore = Reflux.createStore({
    listenables: [NetworkActions, SocketActions],
    init: function() {
      this.network = {};
    },
    onSocketConnected: function(socket) {
      console.log("NetworkStore connected");
      this.socket = socket;
      // TODO: rename 'registered' to 'connected'
      this.socket.on('registered', (network) => {
        console.log("Connected to network", network);
        if(network) {
          this.trigger(network);
          NetworkActions.connected(network);
        }
      });
      this.socket.on('register.error', (err) => {
        console.error("Register error:", err);
        NetworkActions.registerError(err);
      });
    },
    onSocketDisconnected: function() {
      this.socket.removeAllListeners("registered");
      this.socket.removeAllListeners("register.error");
      this.socket = null;
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
    }
});

export default NetworkStore;

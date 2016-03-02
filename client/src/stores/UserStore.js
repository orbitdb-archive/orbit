'use strict';

import Reflux        from 'reflux';
import Actions       from 'actions/SendMessageAction';
import UserActions   from 'actions/UserActions';
import SocketActions from 'actions/SocketActions';

var UserStore = Reflux.createStore({
  listenables: [UserActions, SocketActions],
  init: function() {
    this.user   = {};
    this.socket = null;
  },
  _handleUserUpdated: function(user) {
    if(user) {
      this.user = user;
      console.log("Logged in as ", user);
    } else {
      console.log("Not logged in");
    }
    this.trigger(this.user);
  },
  onSocketConnected: function(socket) {
    console.log("UserStore connected");
    this.socket = socket;
    this.socket.on('registered', (network) => this._handleUserUpdated(network.user));
    this.getWhoami();
  },
  onSocketDisconnected: function() {
    this.socket = null;
    this.user   = {};
    this.trigger(this.user);
  },
  onDisconnect: function() {
    this.user = {};
    this.trigger(this.user);
  },
  onGetUser: function(callback) {
    callback(this.user);
  },
  getWhoami: function() {
    if(!this.socket) {
      console.error("Socket not connected");
      return;
    }
    console.log("--> whoami");
    this.socket.emit('whoami', this._handleUserUpdated);
  }
});

export default UserStore;

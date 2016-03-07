'use strict';

import Reflux        from 'reflux';
import Actions       from 'actions/SendMessageAction';
import UserActions   from 'actions/UserActions';
import NetworkActions from 'actions/NetworkActions';
import SocketActions from 'actions/SocketActions';

var UserStore = Reflux.createStore({
  listenables: [UserActions, SocketActions],
  init: function() {
    this.user = null;
    this.socket = null;
    NetworkActions.connected.listen((network) => this._handleUserUpdated(network.user));
  },
  _handleUserUpdated: function(user) {
    console.log("--> received user:", user);
    if(user) {
      this.user = user;
    } else {
      console.log("Not logged in");
    }
    this.trigger(this.user);
  },
  onSocketConnected: function(socket) {
    console.log("UserStore connected");
    this.socket = socket;
  },
  onSocketDisconnected: function() {
    this.socket = null;
    this.user = null;
    this.trigger(this.user);
  },
  onDisconnect: function() {
    this.user = null;
    this.trigger(this.user);
  },
  onGetUser: function(callback) {
    callback(this.user);
  }
});

export default UserStore;

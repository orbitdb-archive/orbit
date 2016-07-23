'use strict';

import Reflux from 'reflux';
import AppActions from 'actions/AppActions';
import UserActions from 'actions/UserActions';
import NetworkActions from 'actions/NetworkActions';
import SocketActions from 'actions/SocketActions';
import Logger from 'logplease';
const logger = Logger.create('UserStore', { color: Logger.Colors.Green });

var UserStore = Reflux.createStore({
  listenables: [AppActions, UserActions, NetworkActions, SocketActions],
  init: function() {
    this.user = null;
  },
  onInitialize: function(orbit) {
    this.orbit = orbit;
    this.orbit.events.on('connected', (network, user) => {
      logger.info("orbit.event: (network, user)", network, user)
      this._updateUser(user)
    });
  },
  onUpdateUser: function(user) {
    this._updateUser(user);
  },
  _updateUser: function(user) {
    logger.debug("received user");
    console.log(user);
    if(user) {
      this.user = user;
    } else {
      logger.debug("not logged in");
    }
    this.trigger(this.user);
  },
  onSocketConnected: function(socket) {
    logger.debug("connected");
  },
  onSocketDisconnected: function() {
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

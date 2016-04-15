'use strict';

import Reflux from 'reflux';
import Actions from 'actions/UIActions';
import UserActions from 'actions/UserActions';
import NetworkActions from 'actions/NetworkActions';
import SocketActions from 'actions/SocketActions';
import Logger from 'logplease';
const logger = Logger.create('UserStore', { color: Logger.Colors.Green });

var UserStore = Reflux.createStore({
  listenables: [UserActions, NetworkActions, SocketActions],
  init: function() {
    this.user = null;
  },
  onUpdateUser: function(user) {
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

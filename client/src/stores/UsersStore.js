'use strict';

import _ from 'lodash';
import Reflux from 'reflux';
import NetworkActions from 'actions/NetworkActions';
import UserActions from 'actions/UserActions';
import Logger from 'logplease';
const logger = Logger.create('UsersStore', { color: Logger.Colors.Cyan });

var UsersStore = Reflux.createStore({
  listenables: [NetworkActions, UserActions],
  init: function() {
    this.users  = [];
  },
  onDisconnect: function() {
    this.users = [];
    this.trigger(this.users);
  },
  onAddUser: function(user) {
    if(!_.includes(this.users, user))
      this.users.push(user);
  }
  // onGetUserInfo: function(hash, callback) {
  //   if(!this.users[hash]) {
  //     if(!this.socket) {
  //       console.error("Socket not connected");
  //       return;
  //     }

  //     console.log("--> user.get: ", hash);
  //     this.socket.emit('user.get', hash, (result) => {
  //       this.users[hash] = result;
  //       if(!this.users[hash]) this.trigger(this.users);
  //       if(callback) callback(result);
  //     });
  //   } else if(callback) {
  //     callback(this.users[hash]);
  //   }
  // }
});

export default UsersStore;

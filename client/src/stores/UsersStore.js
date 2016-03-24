'use strict';

import _ from 'lodash';
import Reflux from 'reflux';
import NetworkActions from 'actions/NetworkActions';
import SocketActions from 'actions/SocketActions';
import UserActions from 'actions/UserActions';

var UsersStore = Reflux.createStore({
    listenables: [NetworkActions, SocketActions, UserActions],
    init: function() {
      this.users  = [];
      this.socket = null;
    },
    onSocketConnected: function(socket) {
      console.log("UsersStore connected");
      this.socket = socket;
    },
    onDisconnect: function() {
      this.users = [];
      this.trigger(this.users);
    },
    onAddUser: function(user) {
      if(!_.includes(this.users, user))
        this.users.push(user);
      console.log("USERS", this.users);
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

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
    onSocketConnected: function(socket) {
      console.log("UserStore connected");
      this.socket = socket;
      this.socket.on('login', (user) => {
        if(this.user.username) {
          console.log("Logged in as ", user);
        } else {
          console.log("Not logged in");
        }
        if(this.user.username !== user.username) {
          this.user = user;
          this.trigger(this.user);
        }
      });
      this.getWhoami();
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
      this.socket.emit('whoami', (user) => {
        this.user = user;
        if(this.user.username) {
          console.log("Logged in as ", user);
        } else {
          console.log("Not logged in");
        }
        this.trigger(this.user);
      });
    }
});

export default UserStore;

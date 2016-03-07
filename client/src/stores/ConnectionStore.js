'use strict';

import Reflux from 'reflux';
import SocketActions from 'actions/SocketActions';
import NetworkActions from 'actions/NetworkActions';
import ApiUrl from 'utils/apiurl';

var ConnectionStore = Reflux.createStore({
    init: function() {
      this.socket = null;

      this.socket = io(ApiUrl.getSocketUrl(), {
        reconnectionDelay: 0,
        reconnectionDelayMax: 1000
      });

      this.socket.on('connect', () => {
        console.log("WebSocket connected");
        // this.trigger(this.socket);

        this.socket.on('log', (msg) => {
          console.log("log>", msg);
        });

        this.socket.on('registered', (network) => {
          console.log("Connected to network", network);
          NetworkActions.connected(network);
        });

        this.socket.on('network', () => {
          console.log("111");
          NetworkActions.network();
        });

        this.socket.on('orbit.error', (err) => {
          console.error("Register error:", err);
          NetworkActions.registerError(err);
        });

        SocketActions.socketConnected(this.socket);
      });

      this.socket.on('disconnect', () => {
        console.log("WebSocket disconnected");
        this.trigger(null);
        SocketActions.socketDisconnected();
      });

    }
});

export default ConnectionStore;

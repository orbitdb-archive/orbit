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

        // this.socket.on('log', (msg) => {
        //   console.log("log>", msg);
        // });

        this.socket.on('network', (network) => {
          if(network) console.log(network ? "Connected to network: " + network : "Not connected");
          NetworkActions.updateNetwork(network);
          // NetworkActions.connected(network);
        });

        // this.socket.on('registered', (network) => {
        //   console.log("Connected to network", network);
        //   NetworkActions.connected(network);
        // });

        SocketActions.socketConnected(this.socket);
      });

      this.socket.on('disconnect', () => {
        console.log("WebSocket disconnected");
        this.socket.removeAllListeners('network');
        SocketActions.socketDisconnected();
      });

    }
});

export default ConnectionStore;

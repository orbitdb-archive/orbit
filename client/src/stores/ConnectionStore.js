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

        this.socket.on('network', (network) => {
          if(network) console.log(network ? "Connected to network: " + network : "Not connected");
          NetworkActions.updateNetwork(network);
        });

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

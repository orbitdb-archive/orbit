'use strict';

import Reflux from 'reflux';
import SocketActions from 'actions/SocketActions';
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
        this.trigger(this.socket);
        SocketActions.socketConnected(this.socket);
      });

      this.socket.on('disconnect', () => {
        console.log("WebSocket disconnected");
        this.trigger(null);
        SocketActions.socketDisconnected();
      });

      this.socket.on('log', (msg) => {
        console.log(">", msg);
      });
    }
});

export default ConnectionStore;

'use strict';

import Reflux from 'reflux';
import SocketActions from 'actions/SocketActions';
import NetworkActions from 'actions/NetworkActions';
import ApiUrl from 'utils/apiurl';
import Logger from 'logplease';
const logger = Logger.create('ConnectionsStore', { color: Logger.Colors.Black });

var ConnectionStore = Reflux.createStore({
  init: function() {
    this.socket = null;

    this.socket = io(ApiUrl.getSocketUrl(), {
      reconnectionDelay: 0,
      reconnectionDelayMax: 1000
    });

    this.socket.on('connect', () => {
      logger.debug("WebSocket connected");

      this.socket.on('network', (network) => {
        NetworkActions.updateNetwork(network);
      });

      SocketActions.socketConnected(this.socket);
    });

    this.socket.on('disconnect', () => {
      logger.debug("WebSocket disconnected");
      this.socket.removeAllListeners('network');
      SocketActions.socketDisconnected();
    });
  }
});

export default ConnectionStore;

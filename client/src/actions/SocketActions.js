'use strict';

import Reflux from 'reflux';

var SocketActions = Reflux.createActions([
  "socketConnected",
  "socketDisconnected"
]);

export default SocketActions;

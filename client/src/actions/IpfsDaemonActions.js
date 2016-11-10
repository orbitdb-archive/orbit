'use strict';

import Reflux from 'reflux';

var IpfsDaemonActions = Reflux.createActions([
  "setConfig",
  "getConfig",
  "start",
  "ipfsToOrbit",
  "restart",
  "stop"
]);

export default IpfsDaemonActions;

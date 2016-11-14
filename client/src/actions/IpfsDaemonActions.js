'use strict';

import Reflux from 'reflux';

var IpfsDaemonActions = Reflux.createActions([
  "setConfig",
  "initConfig",
  "persist",
  "retrieve",
  "start",
  "restart",
  "stop"
]);

export default IpfsDaemonActions;

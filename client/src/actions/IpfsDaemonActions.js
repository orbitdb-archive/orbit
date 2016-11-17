'use strict';

import Reflux from 'reflux';

var IpfsDaemonActions = Reflux.createActions([
  "setConfig",
  "initConfig",
  "persist",
  "retrieve",
  "start",
  "stop",
  "daemonStarted"
]);

export default IpfsDaemonActions;

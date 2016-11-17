'use strict';

import Reflux from 'reflux';

var IpfsDaemonActions = Reflux.createActions([
  "setConfig",
  "initConfig",
  "persist",
  "retrieve",
  "start",
  "daemonStarted",
  "stop"
]);

export default IpfsDaemonActions;

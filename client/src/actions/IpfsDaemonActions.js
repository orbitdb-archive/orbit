'use strict';

import Reflux from 'reflux';

var IpfsDaemonActions = Reflux.createActions([
  "setConfig",
  "initConfig",
  "persist",
  "start",
  "daemonStarted"
]);

export default IpfsDaemonActions;

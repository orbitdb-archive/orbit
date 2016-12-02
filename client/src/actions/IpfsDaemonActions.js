'use strict';

import Reflux from 'reflux';

var IpfsDaemonActions = Reflux.createActions([
  "initConfiguration",
  "saveConfiguration",
  "start",
  "stop",
  "daemonStarted"
]);

export default IpfsDaemonActions;

'use strict';

import Reflux from 'reflux';

var IpfsDaemonActions = Reflux.createActions([
  "initConfiguration",
  "saveConfiguration",
  "start",
  "daemonStarted"
]);

export default IpfsDaemonActions;

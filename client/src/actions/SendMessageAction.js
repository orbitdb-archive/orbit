'use strict';

import Reflux from 'reflux';

var Actions = Reflux.createActions([
  "raiseError",
  "getSwarm",

  "onJoinChannel",
  "raiseInvalidChannelPassword",

  "onPanelClosed",

  "startLoading",
  "stopLoading",

  "onOpenChannel"
]);

export default Actions;

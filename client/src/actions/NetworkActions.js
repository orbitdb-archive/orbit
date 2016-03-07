'use strict';

import Reflux from 'reflux';

var NetworkActions = Reflux.createActions([
  "connect",
  "connected",
  "disconnect",
  "register",
  "registerError",
  "joinChannel",
  "joinedChannel",
  "joinChannelError",
  "leaveChannel",
  "leftChannel",
  "getChannel",
  "getUserInfo",
  "getOpenChannels",
  "getChannels"
]);

export default NetworkActions;

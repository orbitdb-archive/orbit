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
  "getChannel",
  "getUserInfo",
  "getOpenChannels",
  "getChannels",
  "setIpfs",
  "updateNetwork",
  "updateUser",
  "getPeers"
]);

export default NetworkActions;

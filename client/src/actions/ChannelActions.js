'use strict';

import Reflux from 'reflux';

var ChannelActions = Reflux.createActions([
  "channelInfoReceived",
  "loadOlderMessages",
  "sendMessage",
  "addFile",
  "loadPost",
  "loadDirectoryInfo",
  "setChannelMode",
  "channelModeUpdated"
]);

export default ChannelActions;

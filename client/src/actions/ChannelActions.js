'use strict';

import Reflux from 'reflux';

var ChannelActions = Reflux.createActions([
  "channelInfoReceived",
  "loadOlderMessages",
  "loadMessageContent",
  "sendMessage",
  "addFile",
  "loadDirectoryInfo",
  "setChannelOptions"
]);

export default ChannelActions;

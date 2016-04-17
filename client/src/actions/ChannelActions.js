'use strict';

import Reflux from 'reflux';

var ChannelActions = Reflux.createActions([
  "reachedChannelStart",
  "channelInfoReceived",
  "loadMoreMessages",
  "sendMessage",
  "addFile",
  "loadPost",
  "loadFile",
  "loadDirectoryInfo",
  "setChannelMode",
  "channelModeUpdated"
]);

export default ChannelActions;

'use strict';

import Reflux from 'reflux';

var ChannelActions = Reflux.createActions([
  "reachedChannelStart",
  "channelInfoReceived",
  "loadMessages",
  "loadMoreMessages",
  "sendMessage",
  "removeMessage",
  "addFile",
  "loadPost",
  "loadFile",
  "loadDirectoryInfo",
  "setChannelMode",
  "channelModeUpdated"
]);

export default ChannelActions;

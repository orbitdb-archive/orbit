'use strict';

import Reflux from 'reflux';

var Actions = Reflux.createActions([
  "raiseError",
  "onJoinChannel",
  "onPanelClosed",
  "onOpenChannel",
  "focusOnSendMessage",
  "startLoading",
  "stopLoading"
]);

export default Actions;

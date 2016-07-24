'use strict';

import Reflux from 'reflux';

var UIActions = Reflux.createActions([
  "raiseError",
  "joinChannel",
  // "showChannel",
  "focusOnSendMessage",
  "startLoading",
  "stopLoading",
  "onPanelClosed"
]);

export default UIActions;

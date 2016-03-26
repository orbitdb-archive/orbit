'use strict';

import Reflux from 'reflux';

var AppActions = Reflux.createActions([
  "setLocation",
  "setCurrentChannel",
  "windowLostFocus",
  "windowOnFocus"
  // "increaseUnreadMessagesCount",
  // "increaseMentionsCount",
]);

export default AppActions;

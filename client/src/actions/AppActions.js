'use strict';

import Reflux from 'reflux';

var AppActions = Reflux.createActions([
  "setLocation",
  "setCurrentChannel",
  "increaseUnreadMessagesCount",
  "increaseMentionsCount"
]);

export default AppActions;

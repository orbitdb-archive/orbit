'use strict';

import Reflux from 'reflux';

var AppActions = Reflux.createActions([
  "setCurrentChannel",
  "increaseUnreadMessagesCount",
  "increaseMentionsCount"
]);

export default AppActions;

'use strict';

import Reflux from 'reflux';

var AppActions = Reflux.createActions([
  "initialize",
  "setFeedStreamDatabase",
  "setLocation",
  "setCurrentChannel",
  "windowLostFocus",
  "windowOnFocus"
]);

export default AppActions;

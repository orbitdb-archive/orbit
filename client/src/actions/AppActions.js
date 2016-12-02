'use strict';

import Reflux from 'reflux';

var AppActions = Reflux.createActions([
  "initialize",
  "login",
  "disconnect",
  "setLocation",
  "setCurrentChannel",
  "windowLostFocus",
  "windowOnFocus"
]);

export default AppActions;

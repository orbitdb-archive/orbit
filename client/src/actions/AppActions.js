'use strict';

import Reflux from 'reflux';

var AppActions = Reflux.createActions([
  "initialize",
  "hasInitialized",
  "login",
  "setLocation",
  "setCurrentChannel",
  "windowLostFocus",
  "windowOnFocus"
]);

export default AppActions;

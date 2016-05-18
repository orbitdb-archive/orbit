'use strict';

import Reflux from 'reflux';

var AppActions = Reflux.createActions([
  "initialize",
  "setLocation",
  "setCurrentChannel",
  "windowLostFocus",
  "windowOnFocus"
]);

export default AppActions;

'use strict';

import Reflux from 'reflux';

var AppActions = Reflux.createActions([
  "initialize",
  "hasInitialized",
  "setLocation",
  "setCurrentChannel",
  "windowLostFocus",
  "windowOnFocus"
]);

export default AppActions;

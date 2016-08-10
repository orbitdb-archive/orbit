'use strict';

import Reflux from 'reflux';
import UIActions from 'actions/UIActions';

var LoadingStateStore = Reflux.createStore({
  listenables: [UIActions],
  init: function() {
    this.state = {};
  },
  onStartLoading: function(id, action, message, progress) {
    if(!this.state[id])
      this.state[id] = {};

    this.state[id][action] = {
      message: message,
      // progress: progress
    };

    this.trigger(this.state);
  },
  // onUpdateLoading: function(id, action, progress) {
  //   // console.log("LoadingStateStore - update loading:", id, action, progress);
  //   // TODO
  // },
  onStopLoading: function(id, action) {
    if(this.state[id] && this.state[id][action]) {
      delete this.state[id][action];
      this.trigger(this.state);
    }
  }
});

export default LoadingStateStore;

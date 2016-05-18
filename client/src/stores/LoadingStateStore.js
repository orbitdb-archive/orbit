'use strict';

import Reflux from 'reflux';
import UIActions from 'actions/UIActions';

var LoadingStateStore = Reflux.createStore({
  listenables: [UIActions],
  init: function() {
    this.state = {};
  },
  onStartLoading: function(id, action, message, progress) {
    // console.log("LoadingStateStore - start loading:", id, action, message, progress);
    const old = this.state[id] ? this.state[id][action] : null;

    if(!this.state[id])
      this.state[id] = {};

    this.state[id][action] = {
      loading: true,
      message: message,
      progress: progress
    };

    // if(old)
      this.trigger(this.state);
  },
  onUpdateLoading: function(id, action, progress) {
    // console.log("LoadingStateStore - update loading:", id, action, progress);
    // TODO
  },
  onStopLoading: function(id, action) {
    if(this.state[id] && this.state[id][action]) {
      // this.state[id][action].loading = false;
      delete this.state[id][action];
      this.trigger(this.state);
    }
  }
});

export default LoadingStateStore;

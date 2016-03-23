'use strict';

import Reflux from 'reflux';
import UIActions from 'actions/UIActions';

var LoadingStateStore = Reflux.createStore({
  listenables: [UIActions],
  init: function() {
    this.queue = {};
  },
  onStartLoading: function(id, action, message, progress) {
    // console.log("LoadingStateStore - start loading:", id, action, message, progress);
    if(!this.queue[id])
      this.queue[id] = {};

    this.queue[id][action] = {
      loading: true,
      message: message,
      progress: progress
    };

    this.trigger(this.queue);
  },
  onUpdateLoading: function(id, action, progress) {
    // console.log("LoadingStateStore - update loading:", id, action, progress);
    // TODO
  },
  onStopLoading: function(id, action) {
    // console.log("LoadingStateStore - stop loading:", id, action);
    if(this.queue[id] && this.queue[id][action]) {
      this.queue[id][action].loading = false;
      delete this.queue[id][action];
    }

    this.trigger(this.queue);
  }
});

export default LoadingStateStore;

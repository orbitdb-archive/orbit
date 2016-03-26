'use strict';

import _ from 'lodash';
import Reflux from 'reflux';
import AppActions from 'actions/AppActions';
import NetworkActions from 'actions/NetworkActions';
import NotificationActions from 'actions/NotificationActions';

const AppStateStore = Reflux.createStore({
  listenables: [AppActions, NetworkActions, NotificationActions],
  init: function() {
    this.state = {
      location: null,
      currentChannel: null,
      unreadMessages: {},
      mentions: {},
      hasFocus: true
    };
  },
  onSetLocation: function(location) {
    if(location === this.state.location)
      return;

    this.state.currentChannel = null;
    this.state.location = location;
    this.trigger(this.state);
  },
  onSetCurrentChannel: function(channel) {
    if(channel !== this.state.currentChannel) {
      this.state.currentChannel = channel;
      this.state.location = channel ? `#${channel}` : null;
      delete this.state.unreadMessages[channel];
      delete this.state.mentions[channel];
      this.trigger(this.state);
    }
  },
  onLeaveChannel: function (channel) {
    if(channel === this.state.currentChannel)
      this.onSetCurrentChannel(null);
  },
  onNewMessage: function(channel) {
    if(channel !== this.state.currentChannel || !this.state.hasFocus) {
      if(!this.state.unreadMessages[channel])
        this.state.unreadMessages[channel] = 0;
      this.state.unreadMessages[channel] += 1;
      this.trigger(this.state);
    }
  },
  onMention: function(channel, message) {
    if(channel !== this.state.currentChannel || !this.state.hasFocus) {
      if(!this.state.mentions[channel])
        this.state.mentions[channel] = 0;
      this.state.mentions[channel] += 1;
      this.trigger(this.state);
    }
  },
  onWindowLostFocus: function() {
    this.state.hasFocus = false;
    this.trigger(this.state);
  },
  onWindowOnFocus: function() {
    this.state.hasFocus = true;
    delete this.state.unreadMessages[this.state.currentChannel];
    delete this.state.mentions[this.state.currentChannel];
    this.trigger(this.state);
  }
});

export default AppStateStore;

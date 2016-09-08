'use strict';

import _ from 'lodash';
import Reflux from 'reflux';
import AppActions from 'actions/AppActions';
import NetworkActions from 'actions/NetworkActions';
import ChannelActions from 'actions/ChannelActions';
import AppStateStore from 'stores/AppStateStore';
import Logger from 'logplease';
const logger = Logger.create('ChannelStore', { color: Logger.Colors.Blue });

var ChannelStore = Reflux.createStore({
  listenables: [AppActions, NetworkActions, ChannelActions],
  init: function() {
    this.channels = [];
  },
  onInitialize: function(orbit) {
    this.orbit = orbit;
    this.orbit.events.on('update', (channel) => {
      this.channels = this.orbit.channels;
      this.trigger(this.channels);
    });
  },
  // TODO: remove this function once nobody's using it anymore
  get: function(channel) {
    return this.channels[channel];
  },
  onDisconnect: function() {
    this.channels = [];
    this.trigger(this.channels);
  },
  onJoinChannel: function(channel, password) {
    // TODO: check if still needed?
    if(channel === AppStateStore.state.currentChannel)
      return;

    logger.debug(`Join channel #${channel}`);
    this.orbit.join(channel).then((channelName) => {
      logger.debug(`Joined channel #${channel}`);
      NetworkActions.joinedChannel(channel);
      this.channels = this.orbit.channels;
      this.trigger(this.channels);
      this.orbit.join(channel + ".replies").then((channelName) => {
        logger.debug(`Joined replychannel #${channelName}`);
      });
    });
  },
  onLeaveChannel: function(channel) {
    logger.debug(`Leave channel #${channel}`);
    this.orbit.leave(channel);
    this.channels = this.orbit.channels;
    this.trigger(this.channels);
  }
});

export default ChannelStore;

'use strict';

import _ from 'lodash';
import Reflux from 'reflux';
import UIActions from 'actions/UIActions';
import SocketActions from 'actions/SocketActions';
import NetworkActions from 'actions/NetworkActions';
import ChannelActions from 'actions/ChannelActions';
import AppStateStore from 'stores/AppStateStore';

var ChannelStore = Reflux.createStore({
  listenables: [NetworkActions, SocketActions, ChannelActions],
  init: function() {
    this.channels = [];
  },
  channels: function() {
    return this.channels;
  },
  get: function(channel) {
    return _.find(this.channels, { name: channel });
  },
  onSocketConnected: function(socket) {
    console.log("ChannelStore connected");
    this.socket = socket;
    this.socket.on('channels.updated', this._updateChannels);
    this.socket.emit("channels.get", this._updateChannels);
  },
  _updateChannels: function(channels) {
    console.log("--> received channels:", channels);
    this.channels = channels;
    this.trigger(this.channels);
  },
  onSocketDisconnected: function() {
    this.socket.removeAllListeners('channels.updated');
    this.socket = null;
    this.onDisconnect();
  },
  onDisconnect: function() {
    this.init();
    this.trigger(this.channels);
  },
  onJoinChannel: function(channel, password) {
    if(channel === AppStateStore.state.currentChannel)
      return;

    if(!this.get(channel)) {
      this.socket.emit("channel.join", channel, password, (err, res) => {
        console.log("--> joined channel", channel, password ? "********" : password);
        if(!err) {
          NetworkActions.joinedChannel(channel);
        } else {
          console.error("Can't join #" + channel + ":", err);
          NetworkActions.joinChannelError(channel, err);
        }
      });
    } else {
      UIActions.showChannel(channel);
    }
  },
  onLeaveChannel: function(channel) {
    console.log("--> leave channel", channel);
    this.socket.emit("channel.part", channel);
  }
});

export default ChannelStore;

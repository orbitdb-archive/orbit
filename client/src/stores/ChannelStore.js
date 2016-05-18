'use strict';

import _ from 'lodash';
import Reflux from 'reflux';
import AppActions from 'actions/AppActions';
import SocketActions from 'actions/SocketActions';
import NetworkActions from 'actions/NetworkActions';
import ChannelActions from 'actions/ChannelActions';
import AppStateStore from 'stores/AppStateStore';
import Logger from 'logplease';
const logger = Logger.create('ChannelStore', { color: Logger.Colors.Blue });

var ChannelStore = Reflux.createStore({
  listenables: [AppActions, NetworkActions, SocketActions, ChannelActions],
  init: function() {
    this.channels = [];
  },
  onInitialize: function(orbit) {
    this.orbit = orbit;
    this.orbit.events.on('channels.updated', (channels) => {
      logger.info("orbit event: channels.updated", channels)
      this._updateChannels(channels);
    });
  },
  get: function(channel) {
    return _.find(this.channels, { name: channel });
  },
  onSocketConnected: function(socket) {
    logger.debug("connected");
    this.socket = socket;
    this.socket.on('channels.updated', this._updateChannels);
    this.socket.emit("channels.get", this._updateChannels);
  },
  _updateChannels: function(channels) {
    logger.debug("received channels");
    console.log(channels);
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
  onJoinedChannel: function(channel) {
    this.trigger(this.channels);
  },
  onJoinChannel: function(channel, password) {
    if(channel === AppStateStore.state.currentChannel)
      return;

    // if(!this.socket) {
    //   // console.error("Socket not connected");
    //   return;
    // }

    // this.socket.emit("channel.join", channel, password, (err, res) => {
    this.orbit.join(channel, password, (err, res) => {
      logger.debug("joined channel", channel, res);
      if(!err) {
        NetworkActions.joinedChannel(channel);
        this.trigger(this.channels);
      } else {
        console.error("Can't join #" + channel + ":", err);
        NetworkActions.joinChannelError(channel, err);
      }
    });
  },
  onLeaveChannel: function(channel) {
    console.log("--> leave channel", channel);
    this.socket.emit("channel.part", channel);
  }
});

export default ChannelStore;

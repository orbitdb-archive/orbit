'use strict';

import Reflux         from 'reflux';
import UIActions      from 'actions/SendMessageAction';
import SocketActions  from 'actions/SocketActions';
import NetworkActions from 'actions/NetworkActions';
import ChannelActions from 'actions/ChannelActions';
import NotificationActions from 'actions/NotificationActions';

var ChannelStore = Reflux.createStore({
  listenables: [NetworkActions, SocketActions, ChannelActions],
  init: function() {
    this.network = {};
    this.channels = {};
    this.passwordMap = {};
    NotificationActions.unreadMessages.listen((c) => {
      this.channels[c].unreadMessagesCount += 1;
      this.trigger(this.channels);
    });
  },
  channels: function() {
    return this.channels;
  },
  onSocketConnected: function(socket) {
    console.log("ChannelStore connected");
    this.socket = socket;
  },
  onSocketDisconnected: function() {
    this.socket = null;
    this.channels = {};
    this.trigger(this.channels);
  },
  onDisconnect: function() {
    this.network = {};
    this.channels = {};
    this.passwordMap = {};
    this.trigger(this.channels);
  },
  onJoinChannel: function(channel, password) {
    if(!this.socket) {
      console.error("Socket not connected");
      return;
    }

    if(this.passwordMap[channel] && !password)
      password = this.passwordMap[channel];

    this.socket.emit("channel.join", channel, password, (err, res) => {
      console.log("--> join channel", channel, password ? "********" : password);
      if(!err) {
        this.channels[channel] = res;
        this.channels[channel].readPassword = password;
        this.channels[channel].unreadMessagesCount = 0;
        this.channels[channel].mentions = 0;
        this.passwordMap[channel] = password;
        this.trigger(this.channels);
        NetworkActions.joinedChannel(this.channels[channel]);
        ChannelActions.channelModeUpdated(channel, this.channels[channel].modes);
      } else {
        console.error("Can't join #" + channel + ":", err);
        NetworkActions.joinChannelError(channel, err);
      }
    });
  },
  onLeaveChannel: function(channel) {
    console.log("--> leave channel", channel);
    this.socket.emit("channel.part", channel);
    delete this.channels[channel];
    delete this.passwordMap[channel];
    this.trigger(this.channels);
    NetworkActions.leftChannel(channel);
  },
  onGetChannel: function(channel, callback) {
    callback(this.channels[channel]);
  },
  onSetChannelMode: function(channel, mode) {
    console.log("--> set channel mode", mode);
    this.socket.emit('channel.password', channel, mode, (err, res) => {
      if(err) {
        console.log("Couldn't set channel mode:", err.toString());
        UIActions.raiseError(err.toString());
      } else {
        if(res.modes.r) {
          this.readPassword = res.modes.r ? res.modes.r.password : '';
          this.passwordMap[channel] = res.modes.r.password;
        } else {
          this.readPassword = '';
        }
        ChannelActions.channelModeUpdated(channel, res.modes);
      }
    });
  },
  getOpenChannels: function() {
    this.trigger(this.channels);
  }
});

export default ChannelStore;

'use strict';

import Reflux         from 'reflux';
import SocketActions  from 'actions/SocketActions';
import NetworkActions from 'actions/NetworkActions';
import ChannelActions from 'actions/ChannelActions';
import NotificationActions from 'actions/NotificationActions';

var ChannelStore = Reflux.createStore({
  listenables: [NetworkActions, SocketActions, ChannelActions],
  init: function() {
    this.network = {};
    this.channels = {};
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
  },
  onDisconnect: function() {
    this.channels = [];
  },
  onJoinChannel: function(channel, password) {
    if(!this.socket) {
      console.error("Socket not connected");
      return;
    }

    this.socket.emit("channel.join", channel, password, (err, res) => {
      console.log("--> join channel", channel, password ? "********" : password);
      if(!err) {
        console.log("joined #" + channel, res);
        this.channels[channel] = res;
        this.channels[channel].name = channel;
        this.channels[channel].readPassword = password;
        this.channels[channel].unreadMessagesCount = 0;
        this.channels[channel].mentions = 0;
        this.trigger(this.channels);
        NetworkActions.joinedChannel(res);
      } else {
        console.error("Can't join #" + channel + ":", err);
        NetworkActions.joinChannelError(err);
      }
    });
  },
  onLeaveChannel: function(channel) {
    console.log("--> leave channel", channel);
    this.socket.emit("channel.part", channel);
    delete this.channels[channel];
    this.trigger(this.channels);
    NetworkActions.leftChannel(channel);
  },
  onGetChannelInfo: function(channel) {
    if(!this.socket) {
      console.error("Socket not connected");
      return;
    }

    console.log("--> get channel info", channel);
    this.socket.emit('channel.info', channel, (channelInfo) => {
      console.log("CHANNEL INFO", channelInfo);
      ChannelActions.channelInfoReceived(channelInfo);
    });
  },
  getOpenChannels: function() {
    this.trigger(this.channels);
  }
});

export default ChannelStore;
